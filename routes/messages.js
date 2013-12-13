var fs = require("fs");
var GUIDUtil = require('GUIDUtil');
var shortURLPromise;
var shrt = require('short');
var os = require("os");
// var MongoClient = require('mongodb').MongoClient
// var format = require('util').format;



var NO_BODY = "files not found";
var NO_FILES = "body not found";

var mongo_url = "mongodb://chatwala_mongo:CbvTA5.gkm.N9DJhYtWgKy1HRQZRGB_4mAftidt4wkA-@ds035787.mongolab.com:35787/chatwala_mongo";
var server_hostname;

shrt.connect(mongo_url);
shrt.connection.on("error", function(err){
	throw new Error(err);
});


function getMessage( req, res )
{
	var message_id = req.params.message_id;
	console.log("message_id",message_id);
	
	shrt.retrieve(message_id).then( onGetKeySuccess, onGetKeyFailure );
	
	function onGetKeySuccess(result)
	{
		// var new_key = result.hash;
		console.log("onGetKeySuccess",result);
		
		res.sendfile( __dirname + "/uploads/"+result.URL+"/chat.wala");
	}
	function onGetKeyFailure(err)
	{
		res.send("onGetKeyFailure",500,err);
	}
}



function submitMessage( req, res )
{
	if(req.hasOwnProperty("body"))
	{
		console.log(req.body);
        // continue
        if(req.hasOwnProperty("files"))
        {


			// console.log("file:"+req.files.file);
			// console.log("path:"+req.files.file.path);
			
			
			var messageFile = req.files.file.path;
			console.log("messageFile",messageFile);
			fs.readFile(messageFile, function (err, data) 
			{
				var message_id = req.body.message_id;
				var recipient_id = req.body.recipient_id;
				var sender_id = req.body.sender_id;
				var key = GUIDUtil.GUID();
				var new_dir = __dirname + "/uploads/"+key;
				
				fs.mkdir(new_dir, function(err){
					var newPath = new_dir+"/chat.wala";
					console.log("newPath",newPath);
				 	fs.writeFile(newPath, data, function (err) {
					
						// shorten url 
						var shortURLPromise = shrt.generate({
						  URL : key
						});
						
						shortURLPromise.then(onShortenSuccess,onShortenFailure);
						
						
						function onShortenSuccess(mongoDoc)
						{
							shrt.retrieve(mongoDoc.hash).then( onGetKeySuccess, onGetKeyFailure );
						}
						function onShortenFailure(err)
						{
							throw new Error(err);
						}
						
						function onGetKeySuccess(result)
						{
							var new_key = result.hash;
							// res.send(200,{ status:"OK", messageURL: ("http://"+os.hostname()+":"+server_hostname.port+"/messages/"+new_key), recipient: recipient_id, sender:sender_id });
							res.send(200,[{ status:"OK", url: ("chatwala://message/"+new_key), recipient: recipient_id, sender:sender_id }]);
						}
						function onGetKeyFailure(err)
						{
							throw new Error(err);
						}
						
					
						
				  	});
				});
			});
        }
        else
        {
			console.log(NO_FILES);
            res.send(400,{status:"FAIL", message:NO_FILES});
        }
	    
	}else{
		console.log(NO_BODY);
        res.send(400,{status:"FAIL", message:NO_BODY});
	}
}


function setHostname(hostname)
{
	server_hostname = hostname;
}





exports.submitMessage = submitMessage;
exports.getMessage = getMessage;
exports.setHostname = setHostname;