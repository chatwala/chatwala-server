var azure = require("azure");
var fs = require("fs");
var azure = require('azure');
var uuid = require('node-uuid');
var nconf = require('nconf');
var GUIDUtil = require('GUIDUtil');
var shortURLPromise;
var os = require("os");
var MongoClient = require('mongodb').MongoClient
var format = require('util').format;
var account = "chatwala";
var access_key = "mEJKFMneQXAaYh3lbUKaoWUeMZR9t+5uqJbvcaRJ0+KRbiZiNaaUg1t3jUsM5UWMf8RhEQXCo5BzcCOANZjkEA==";
var host = "chatwala";

var blobService = null;

function getBlobService()
{
	if(blobService == null)
	{
		blobService = azure.createBlobService(account,access_key);
		blobService.createContainerIfNotExists("messages", function(error){
		    if(!error){
		        // Container exists and is private
				console.log("messages table ready!");
		    }

		});
	}
	return blobService;
}





var NO_BODY = "files not found";
var NO_FILES = "body not found";

var mongo_url = "mongodb://chatwala_mongo:CbvTA5.gkm.N9DJhYtWgKy1HRQZRGB_4mAftidt4wkA-@ds035787.mongolab.com:35787/chatwala_mongo";
var server_hostname;



function getUserMessages( req, res )
{
	console.log("fetching messages");
	var user_id = req.params.user_id;
	var results = { "user":user_id ,"messages":[]};
	getBlobService().listBlobs("messages", function(error, blobs){
	    if(!error){
	        for(var index in blobs){
	            console.log(blobs[index].name);
				results.messages.push(blobs[index].name);
	        }
			res.send(200,results);
	    }
	});
}




function getMessage( req, res )
{
	var message_id = req.params.message_id;
	console.log("fetching path for message_id:",message_id);
	var temp_file_name = GUIDUtil.GUID();
	var newPath = __dirname + "/temp/"+temp_file_name;
	getBlobService().getBlobToFile("messages", message_id, newPath, function(error){
		if(!error)
		{

			res.sendfile( newPath, function(err){
				if(err) throw err;
				fs.unlink(newPath, function (err) {
				  if (err) throw err;
				  console.log('successfully deleted',newPath);
				});
			});
			
			
		}else{
			console.log("failed to retrieve file");
		}
	});
}


function submitMessageMetadata( req, res )
{
	console.log("submitMessageMetadata");
	if(req.hasOwnProperty("body"))
	{
		var recipient_id = req.body.recipient_id;
		var sender_id = req.body.sender_id;
		var message_id = GUIDUtil.GUID();
		var new_dir = __dirname + "/uploads/"+message_id;
		fs.mkdir(new_dir, function(err){
			if(err)throw err;
			console.log("recieved metadata!");
			saveOutGoingMessage(req.body,message_id, function(err){
				if(err)throw err;
				var results = {status:"OK", message_id:message_id, url: ("chatwala://message/" + message_id)};
				console.log("sending response: ",results);
				res.send(200, results);
			});
			
			
		});
	}else{
		console.log(NO_BODY);
        res.send(400,{status:"FAIL", message:NO_BODY});
	}
}



function saveOutGoingMessage( message_metadata, message_id, callback )
{
	MongoClient.connect(mongo_url, function(err, db)
	{
		if(err)throw err;
		var collection = db.collection('users');
		var sender_id = message_metadata.sender_id;
		var recipient_id = message_metadata.recipient_id;
		
		console.log("locating user: ",recipient_id);
		
		if(message_metadata.recipient_id == "unknown_recipient")
		{
			// unknown recipient
			callback(null);
		}else{
			// known recipient
			collection.findAndModify({"user_id":recipient_id},[['_id','asc']],{$push:{"inbox":message_metadata}},{},function(err,object){
				if(!err)
				{
					console.log("updated inbox:",object);
					callback(null);
				}else{
					callback(err);
				}
				db.close();
			});
		}
		
		
		
	
	});
}


function uploadMessage( req, res )
{
	console.log("uploadMessage");
	
	var message_id = req.params.message_id;
	var messageFile = req.files.file.path;
	var recipient_id = req.body.recipient_id;
	var sender_id = req.body.sender_id;
	
	fs.readFile(messageFile, function (err, data) 
	{
		getBlobService().createBlockBlobFromFile("messages" , message_id, messageFile, function(error){
			if(!error){
				console.log("message stored!");
				res.send(200,[{ status:"OK"}]);
			}else{
				console.log("error",error);
			}
		});
	});
}

function setHostname(hostname)
{
	server_hostname = hostname;
}





exports.submitMessageMetadata = submitMessageMetadata;
exports.uploadMessage = uploadMessage;
exports.getMessage = getMessage;
exports.getUserMessages = getUserMessages;
exports.setHostname = setHostname;