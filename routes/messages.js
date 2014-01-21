var fs = require("fs");
var azure = require("azure");
var GUIDUtil = require('GUIDUtil');
var os = require("os");
var CWMongoClient = require('../cw_mongo.js');

var NO_FILES = "files not found";
var NO_BODY = "no post information found for POST /messages";

var utility = require('../utility');

function compareMessageMetadata(a,b) {
  if (a.timestamp < b.timestamp)
     return 1;
  if (a.timestamp > b.timestamp)
    return -1;
  return 0;
}

/**

Returns List of User's Messages

**/

function getUserMessages( req, res ) {
	var user_id = req.params.user_id;
	
	CWMongoClient.getConnection(function (err, db) {
	
		if (err) { 
			res.send(500,{"error":"unable to fetch messages - database error: " + err});
		} else {
			var collection = db.collection('users');
			collection.findOne({"user_id":user_id}, function(err,user){
			
				if(!err && user && user.inbox) {
					var messages = user.inbox.sort(compareMessageMetadata);
					console.log("user messages fetched for user: " + user_id);
					var results = { "user":user_id ,"messages":messages};
					res.send(200,results)
				} else{
					console.log("unable to fetch message for user - not found userId: ", user_id);
					res.send(404,{"status":"user not found"});
				}		
			});	
		}
	});	
}

/**
	Endpoint Handler for retrieving message file
**/
function getMessage( req, res )
{
	var message_id = req.params.message_id;

	//create a SAS that expires in an hour
	var sharedAccessPolicy = {
		AccessPolicy: {
			Permissions: 'r',
			Expiry: azure.date.minutesFromNow(60)
		}
	};

	var sasUrl = utility.getBlobService().getBlobUrl("messages", message_id, sharedAccessPolicy);

	if (sasUrl) {
		console.log("Fetched shared access message url for blob - redirecting");
		res.writeHead(302, {
			'Location': sasUrl
		});
		res.end();
	}
	else {
		console.log("Unable to retrieve shared access url for message: " + message_id);
		res.send(404);
	}
}


function submitMessageMetadata( req, res )
{
	if(req.hasOwnProperty("body")) {
	
		var recipient_id = req.body.recipient_id;
		var sender_id = req.body.sender_id;
		
		var message_metadata =  req.body;
		message_metadata.message_id = GUIDUtil.GUID();
		message_metadata.timestamp = Math.round((new Date()).getTime() / 1000);
		message_metadata.thumbnail = "http://" + req.headers.host + "/users/" + sender_id + "/picture";
		
		saveOutGoingMessage(message_metadata, function(err) {
			if(err)throw err;
			var results = {status:"OK", message_id:message_metadata.message_id, url: ("http://chatwala.com/?" + message_metadata.message_id)};
			console.log("sending response: ", results);
			res.send(200, results);
		});
	}
	else {
		console.log(NO_BODY);
        res.send(400,{status:"FAIL", message:NO_BODY});
	}
}


function saveOutGoingMessage( message_metadata, callback ) {
	CWMongoClient.getConnection(function (err, db) {
	
		if (err) { 
			res.send(500,{"error":"unable to fetch messages - database error: " + err});
		}
		else {
			var collection = db.collection('users');
			var sender_id = message_metadata.sender_id;
			var recipient_id = message_metadata.recipient_id;
		
			console.log("sender: ", sender_id);
			console.log("locating recipient: ",recipient_id);
		
			if(message_metadata.recipient_id == "unknown_recipient") {
				// unknown recipient
				callback(null);
			} else{
				// known recipient
				console.log("saving message: ", message_metadata );
			
				collection.findAndModify({"user_id":recipient_id},[['_id','asc']],{ $push:{"inbox": message_metadata  }},{},function(err,object){
					if(!err)
					{
						console.log("updated inbox for recipient: " + recipient_id);
						callback(null);
					}else{
						callback("unable to save outbound message - cannot find recipient: ", recipient_id);
					}
				});
			}
		}
	});
}

/**
 Endpoint Handler for Chatwala File (PUT)
**/
function uploadMessage( req, res ) {

	// get message_id parameter
	var message_id = req.params.message_id;
	var fileSize = req.headers['content-length'];
	
	console.log("Streaming message to blob...");
	utility.getBlobService().createBlockBlobFromStream("messages", message_id, req, fileSize, [], function(err, arg1, arg2) {
		if (err) {
			console.log("error uploading message file: " + err);
			return res.send(404, { error: "error uploading message" });
		}
		else {
			console.log("message stored!");
			res.send(200, [{ status:"OK"}]);
		}
	});
}

exports.submitMessageMetadata = submitMessageMetadata;
exports.uploadMessage = uploadMessage;
exports.getMessage = getMessage;
exports.getUserMessages = getUserMessages;