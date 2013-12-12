var fs = require("fs");
var GUIDUtil = require('GUIDUtil');




var NO_BODY = "files not found";
var NO_FILES = "body not found";









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
			});
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






exports.submitMessage = submitMessage;
exports.getMessage = getMessage;