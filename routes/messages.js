var fs = require("fs");
var azure = require('azure'),
	uuid = require('node-uuid'),
	nconf = require('nconf');
	
var GUIDUtil = require('GUIDUtil');




nconf.env().file({ file: 'config.json'});
var tableName = nconf.get("TABLE_NAME")
  , partitionKey = nconf.get("PARTITION_KEY")
  , accountName = nconf.get("STORAGE_NAME")
  , accountKey = nconf.get("STORAGE_KEY");



var NO_BODY = "files not found";
var NO_FILES = "body not found";
var MESSAGES_CONTAINER = "messages";




var retryOperations = new azure.ExponentialRetryPolicyFilter();
var blobService = azure.createBlobService().withFilter(retryOperations);

blobService.createContainerIfNotExists(MESSAGES_CONTAINER, function(error){
    if(!error){
        // Container exists and is private
    }
});



function insertNewMessage( message, callback )
{
	blobService.createBlockBlobFromFile( MESSAGES_CONTAINER, message.message_id, message.file, handler );
	function handler(err)
	{
		if(err)
		{
			callback(err);
		}else{
			callback();
		}
	}
}


function getMessage( req, response )
{
	response.send("getMessage");
}



function submitMessage( req, res )
{
	if(req.hasOwnProperty("body"))
	{
		console.log(req.body);
        // continue
        if(req.hasOwnProperty("files"))
        {
        	console.log("files found",req.files);
			var messageFile = req.files.userPhoto.path;
			console.log("messageFile",messageFile);
			
			var key = GUIDUtil.GUID();
			
			var message_object  = {
				messageKey:key,
				file:messageFile
			}
			
			insertNewMessage( message_oject, function(err){
				if(err)
				{
					res.send(400,err);
				}else{
					res.send(200,{ status:"OK", message_key:key, recipient: recipient_id, sender:sender_id });
				}
			});
			/*
			
			fs.readFile(messageFile, function (err, data) {
				var message_id = req.body.message_id;
				var recipient_id = req.body.recipient_id;
				var sender_id = req.body.sender_id;
				var key = GUIDUtil.GUID();
				var new_dir = __dirname + "/uploads/"+key;
				fs.mkdir(new_dir, function(err){
					var newPath = new_dir+"/chat.wala";
					console.log("newPath",newPath);
				 	fs.writeFile(newPath, data, function (err) {
						res.send(200,{ status:"OK", message_key:key, recipient: recipient_id, sender:sender_id });
				  	});
				});
			});*/
        }
        else
        {
			console.log(NO_FILES);
            res.send(400,NO_FILES);
        }
	    
	}else{
		console.log(NO_BODY);
        res.send(400,NO_BODY);
	}
}

function Message(storageCLient, tableName, partitionKey )
{
	this.storageClient = storageClient;
	this.tableName = tableName;
	this.partitionKey = partitionKey;
	
	this.storageClient.createTableIfNotExists(tableName, function tableCreated(err){
		if err throw err;
	});
}

Message.prototype = {
	find: function( query, callback )
	{
		self = this;
		self.storageClient.queryEntities( query, function entitiesQueried(err, entities){
			if(err) callback(err);
			callback(null,entities);
		});
	},
	
	addItem: function( item, callback )
	{
		self = this;
		item.RowKey = uuid()l
		item.PartitionKey = self.partitionKey;
		item.complete = false;
		self.storageClient.insertEntity( self.tableName, item, function entityInserted(err){
			if(err) callback(err);
			callback(null);
		});
	},
	
	updateItem: function( item, callback )
	{
		
	},
	
}




exports.submitMessage = submitMessage;
exports.getMessage = getMessage;