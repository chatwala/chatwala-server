var azure = require("azure");
var fs = require("fs");
var GUIDUtil = require('GUIDUtil');
var shortURLPromise;
// var shrt = require('short');
var os = require("os");
// var MongoClient = require('mongodb').MongoClient
// var format = require('util').format;
var account = "chatwala";
var access_key = "mEJKFMneQXAaYh3lbUKaoWUeMZR9t+5uqJbvcaRJ0+KRbiZiNaaUg1t3jUsM5UWMf8RhEQXCo5BzcCOANZjkEA==";
var host = "chatwala";

var blobService = azure.createBlobService(account,access_key);
blobService.createContainerIfNotExists("messages", function(error){
    if(!error){
        // Container exists and is private
		console.log("messages table ready!");
    }
	
});

var NO_BODY = "files not found";
var NO_FILES = "body not found";

// var mongo_url = "mongodb://chatwala_mongo:CbvTA5.gkm.N9DJhYtWgKy1HRQZRGB_4mAftidt4wkA-@ds035787.mongolab.com:35787/chatwala_mongo";
var server_hostname;
// 
// shrt.connect(mongo_url);
// shrt.connection.on("error", function(err){
// 	throw new Error(err);
// });


function getMessage( req, res )
{
	var message_id = req.params.message_id;
	console.log("fetching path for message_id:",message_id);
	res.sendfile( __dirname + "/uploads/"+message_id+"/chat.wala");
	
	
	// shrt.retrieve(message_id).then( onGetKeySuccess, onGetKeyFailure );
	
	// function onGetKeySuccess(result)
	// 	{
	// 		// var new_key = result.hash;
	// 		console.log("onGetKeySuccess",result);
	// 		
	// 		res.sendfile( __dirname + "/uploads/"+message_id+"/chat.wala");
	// 	}
	// 	function onGetKeyFailure(err)
	// 	{
	// 		res.send("onGetKeyFailure",500,err);
	// 	}
}

function submitMessageMetadata( req, res )
{
	if(req.hasOwnProperty("body"))
	{
		var recipient_id = req.body.recipient_id;
		var sender_id = req.body.sender_id;
		var message_id = GUIDUtil.GUID();
		var new_dir = __dirname + "/uploads/"+message_id;
		fs.mkdir(new_dir, function(err){
			if(err)throw err;
			res.send(200, {status:"OK", message_id:message_id, url: ("chatwala://message/" + message_id)});
		});
	}else{
		console.log(NO_BODY);
        res.send(400,{status:"FAIL", message:NO_BODY});
	}
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
		blobService.createBlockBlobFromFile("messages" , message_id, messageFile, function(error){
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
exports.setHostname = setHostname;