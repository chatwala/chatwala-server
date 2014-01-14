var CWMongoClient = require('../cw_mongo.js');
var format = require('util').format;
var GUIDUtil = require('GUIDUtil');
var config = require('../config.json');
var mongo_url = config["MONGO_DB"];
var utility = require('../utility');
var fs = require("fs");
var azure = require('azure');

/*var collection;
MongoClient.connect(mongo_url, function(err,db) {
	if(err) {
		db.close();
		throw err;
	}
	else {
		console.log("Mongo client connected to user collection.");
		collection = db.collection('users');
	}
});*/

function registerNewUser( req, res )
{
	console.log("Creating new user.");
	
	var user_id = GUIDUtil.GUID();
	saveNewUser(user_id, function(err,results){
		if(err) {
			console.log(err);
			res.send(500);
		} else {
			res.send(200,results);
		}
	});
}

function saveNewUser(user_id, callback) {
	
	CWMongoClient.getConnection (function (err, db) {
	
		if (err) { 
			callback(error); 
		} else {
			var collection = db.collection('users');
			
			collection.insert( {"user_id":user_id, inbox:[], sent:[], emails:[], devices:[] }, function(err, docs ){
				if(!err) {
					console.log("new user saved:",docs)
					callback(null,docs);
					//db.close();
				}else {
					callback(err);
					//db.close();
				}		
			});	
		}		
	});
	
	/*if (!collection) {			
		callback("Error occurred");
	}
	else {
		collection.insert( {"user_id":user_id, inbox:[], sent:[], emails:[], devices:[] }, function(err, docs ){
			if(!err) {
				console.log("new user saved:",docs)
				callback(null,docs);
				//db.close();
			}else {
				callback(err);
				//db.close();
			}		
		});
	}*/
}

/**
	Endpoint Handler for retrieving message file
**/
function getProfilePicture( req, res )
{
	var user_id = req.params.user_id;
	
	console.log("fetching path for user_id:",user_id);
	
	var newPath = utility.createTempFilePath();
	//first agrument is the container it should prob be "profilePicture" instead of "messages"
	utility.getBlobService().getBlobToFile("messages", user_id, newPath, function(error){
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
			res.send(404,{"status":"user not found", "user_id":user_id});
		}
	});
}


function updateProfilePicture( req, res )
{
	
	// get user_id parameter
	var user_id = req.params.user_id;
	// create a temp file
	var tempFilePath = utility.createTempFilePath();
	var file = fs.createWriteStream(tempFilePath);
	

	var fileSize = req.headers['content-length'];
	var uploadedSize = 0;
	
	console.log("storing user blob with ID:",user_id);

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
	console.log("userid", user_id)
	console.log("file", tempFilePath)
	
	// handle end event
	req.on("end",function(){
		// save data to blob service with user_id
		console.log("userid", user_id)
		console.log("file", tempFilePath)
		//first agrument is the container it should prob be "profilePicture" instead of "messages"
		utility.getBlobService().createBlockBlobFromFile("messages" , user_id, tempFilePath, function(error){
			if(!error){
				console.log("profile image stored!");
				res.send(200,[{ status:"OK"}]);
			}else{
				console.log("blob error",error);
				res.send(400,[{ error:"need image asset"}])
			}
			// delete the temp file
			fs.unlink(tempFilePath,function(err){

			});
		});
	});
}

exports.updateProfilePicture = updateProfilePicture;
exports.getProfilePicture = getProfilePicture;
exports.registerNewUser = registerNewUser;
