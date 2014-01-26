var fs = require("fs");
var azure = require("azure");
var GUIDUtil = require('GUIDUtil');
var os = require("os");
var CWMongoClient = require('../cw_mongo.js');
var config = require('../config.js')();
var hub = azure.createNotificationHubService(config.azure.hub_name, config.azure.hub_endpoint,config.azure.hub_keyname,config.azure.hub_key);

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
					console.log("unable to fetch message for user " + user_id + " error: ", err);
					res.send(404);
				}		
			});	
		}
	});	
}


/**
	Endpoint Handler for retrieving SAS Url for file upload
**/
function getSASurl( req, res )
{
	var message_id = req.params.message_id;

	//create a SAS that expires in an hour
	var sharedAccessPolicy = {
		AccessPolicy: {
			Permissions: 'w',
			Expiry: azure.date.minutesFromNow(10)
		}
	};

	var sasUrl = utility.getBlobService().getBlobUrl("messages", message_id, sharedAccessPolicy);

	if (sasUrl) {
		console.log("Fetched shared access message url for blob - redirecting");
		res.send(200, {'url': sasUrl});
	}
	else {
		console.log("Unable to retrieve shared access url for message: " + message_id);
		res.send(404);
	}
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
		console.log("NO_BODY");
        res.send(400,{status:"FAIL", message:"NO_BODY"});
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
					if(!err) {
						console.log("updated inbox for recipient: " + recipient_id);
						
						
						collection.findOne({"user_id":recipient_id}, function(err,user){
			
							if(!err && user && user.inbox) {
								var messages = user.inbox.sort(compareMessageMetadata);
								console.log("inbox for recipient: ",user.inbox);
								
							} else{
								console.log("unable to fetch inbox for recipient " + recipient_id + " error: ", err);
								
							}		
						});	
						
						var payload = {"content_available": 1,"message": "You have a received a new Chatwala reply."};

						hub.send(recipient_id, payload, function(err,result,responseObject){
							if(err){
								console.log("Error sending APNS payload to " + recipient_id);
								console.log(err);
								callback(err);
							}
							else{
								console.log('successfully sent push notification to user: ' + recipient_id);
								callback(null);
							}
						})

					} 
					else{
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
	// create a temp file
	var tempFilePath = utility.createTempFilePath();
	var file = fs.createWriteStream(tempFilePath);
	

	var fileSize = req.headers['content-length'];
	var uploadedSize = 0;
	
	console.log("storing message blob with ID:",message_id);

	// handle data events
	req.on( "data",function( chunk ){
		uploadedSize += chunk.length;
		var bufferStore = file.write(chunk);
		if(bufferStore == false)
			req.pause();
	});
	
	// handle drain events
	file.on('drain', function() {
	    req.resume();
	});
	
	// handle end event
	req.on("end",function(){
		// save data to blob service with message_id
		utility.getBlobService().createBlockBlobFromFile("messages" , message_id, tempFilePath, function(error){
			if(!error){
				console.log("message stored!");
				res.send(200,[{ status:"OK"}]);
			}else{
				console.log("error",error);
			}
			// delete the temp file
			fs.unlink(tempFilePath,function(err){

			});
		});
	});
}

exports.submitMessageMetadata = submitMessageMetadata;
exports.uploadMessage = uploadMessage;
exports.getMessage = getMessage;
exports.getUserMessages = getUserMessages;
exports.getSASurl = getSASurl