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

var config = require('../config.json');
var account = config["STORAGE_NAME"];
var access_key = config["STORAGE_KEY"];
var host = config["PARTITION_KEY"];
var mongo_url = config["MONGO_DB"];

var blobService = null;
var NO_BODY = "files not found";
var NO_FILES = "body not found";




/**
 Lazy Creation of Blob Service

**/
function getBlobService()
{
	if(blobService == null)
	{
		blobService = azure.createBlobService(account,access_key);
		blobService.createContainerIfNotExists("messages", function(error){
		    if(!error){
				console.log("messages table ready!");
		    }else{
				console.log("failed to connect to blob service!");
				blobService = null;
			}
		});
	}
	return blobService;
}








function getUserMessages( req, res )
{
	console.log("fetching messages");
	var user_id = req.params.user_id;
	MongoClient.connect(mongo_url, function(err, db)
	{
		if(err)throw err;
		var collection = db.collection('users');
		collection.find({"user_id":user_id}).toArray(function(err,objects){
			if(!err)
			{
				console.log(JSON.stringify(objects,undefined,4));
				if(objects.length)
				{
					var user = objects[0];
					var results = { "user":user_id ,"messages":user.inbox};
					res.send(200,results)
				}else{
					// user not found
					res.send(500,{"status":"user not found"});
				}
			}else{
				res.send(500,err);
			}
			db.close();
		});
	});
}


/**
	Endpoint Handler for retrieving message file
**/
function getMessage( req, res )
{
	var message_id = req.params.message_id;
	
	console.log("fetching path for message_id:",message_id);
	
	var newPath = createTempFilePath();
	
	getBlobService().getBlobToFile("messages", message_id, newPath, function(error){
		if(!error)
		{
			console.log("send file: ",newPath);
			res.sendfile(newPath, function(err){
				if(err) throw err;
				fs.unlink(newPath, function (err) {
				  if (err) throw err;
				  console.log('successfully deleted',newPath);
				});
			});
			
			
		}else{
			console.log("failed to retrieve file");
			res.send(200,{"status":"message not found", "message_id":message_id});
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
		console.log("recieved metadata!");
		
		var message_metadata =  req.body;
		message_metadata.message_id = GUIDUtil.GUID();
		
		saveOutGoingMessage(message_metadata, function(err){
			if(err)throw err;
			var results = {status:"OK", message_id:message_metadata.message_id, url: ("chatwala://message/" + message_metadata.message_id)};
			console.log("sending response: ",results);
			res.send(200, results);
		});
	}else{
		console.log(NO_BODY);
        res.send(400,{status:"FAIL", message:NO_BODY});
	}
}



function saveOutGoingMessage( message_metadata, callback )
{
	MongoClient.connect(mongo_url, function(err, db)
	{
		if(err)throw err;
		var collection = db.collection('users');
		var sender_id = message_metadata.sender_id;
		var recipient_id = message_metadata.recipient_id;
		
		console.log("locating recipient: ",recipient_id);
		
		if(message_metadata.recipient_id == "unknown_recipient")
		{
			// unknown recipient
			callback(null);
		}else{
			// known recipient
			console.log("saving message: ", message_metadata );
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

/**
 Endpoint Handler for Chatwala File
**/
function uploadMessage( req, res )
{
	
	
	// get message_id parameter
	var message_id = req.params.message_id;
	// create a temp file
	var tempFilePath = createTempFilePath();
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
		getBlobService().createBlockBlobFromFile("messages" , message_id, tempFilePath, function(error){
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

function createTempFilePath()
{
	var tempFileName =  GUIDUtil.GUID();
	return __dirname + "/temp/"+tempFileName;
}



exports.submitMessageMetadata = submitMessageMetadata;
exports.uploadMessage = uploadMessage;
exports.getMessage = getMessage;
exports.getUserMessages = getUserMessages;