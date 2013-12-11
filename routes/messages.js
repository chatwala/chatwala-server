var fs = require("fs");


exports.submitMessage = function( req, res )
{
	// console.log("body",request.body);
	// console.log("files",request.files);
	// console.log("rawBody",request.rawBody);
	// 
	// 
	// response.send("submitMessage");
	
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
			  // ...
				var message_id = req.body.message_id;
				var recipient_id = req.body.recipient_id;
				var new_dir = __dirname + "/uploads/"+recipient_id
				fs.mkdir(new_dir, function(err){
					var newPath = new_dir+"/"+message_id+".wala";
					console.log("newPath",newPath);
				 	fs.writeFile(newPath, data, function (err) {
						res.send(200,"OK");
				  	});
				});
			
				
				
			});
        }
        else
        {
			console.log("files required");
            // fail. no file
            res.send(400,"files required");
        }
	    
	}else{
		console.log("body not found");
        // fail. no file
        res.send(400,"body not found");
	}
}


exports.getMessage = function( req, response )
{
	response.send("getMessage");
}



function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
             .toString(16)
             .substring(1);
};

function guid() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
         s4() + '-' + s4() + s4() + s4();
}