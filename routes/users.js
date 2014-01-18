var CWMongoClient = require('../cw_mongo.js');
var format = require('util').format;
var GUIDUtil = require('GUIDUtil');
var config = require('../config.json');
var utility = require('../utility');
var fs = require("fs");
var azure = require('azure');

function registerNewUser( req, res )
{	
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
	
	CWMongoClient.getConnection(function (err, db) {
	
		if (err) { 
			callback(error); 
		} else {
			var collection = db.collection('users');
			
			collection.insert( {"user_id":user_id, inbox:[], sent:[], emails:[], devices:[] }, function(err, docs ){
				if(!err) {
					console.log("new user saved in database: " + user_id);
					callback(null,docs);
				}else {
					console.log("unable to save user to database: ", err);
					callback(err);

				}		
			});	
		}		
	});
}

/**
	Endpoint Handler for retrieving message file
**/
function getProfilePicture( req, res )
{
	var user_id = req.params.user_id;
	
	//create a SAS that expires in an hour
	var sharedAccessPolicy = {
		AccessPolicy: {
			Permissions: 'r',
			Expiry: azure.date.minutesFromNow(60)
		}
	};

	var sasUrl = utility.getBlobService().getBlobUrl("pictures", user_id, sharedAccessPolicy);

	if (sasUrl) {
		console.log("Fetched shared access url for picture blob - redirecting");
		res.writeHead(302, {
			'Location': sasUrl
		});
		res.end();
	}
	else {
		console.log("Unable to retrieve shared access picture url for user: " + user_id);
		res.send(404);
	}
	
	/*
	var newPath = utility.createTempFilePath();
	
	utility.getBlobService().getBlobToFile("pictures", user_id, newPath, function(error){
		if(!error)
		{
			res.sendfile(newPath, function(err){
				if(err) throw err;
				console.log("sent picture: " + newPath + " for userId: " + user_id);
				fs.unlink(newPath, function (err) {
				  if (err) throw err;
				  console.log('successfully deleted',newPath);
				});
			});
			
			
		}else{
			console.log("failed to retrieve picture: " + error);
			res.send(404,{"status":"user not found", "user_id":user_id});
		}
	});*/
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
		// save data to blob service with user_id
		console.log("saving picture for userid", user_id)
		//first agrument is the container it should prob be "profilePicture" instead of "messages"
		utility.getBlobService().createBlockBlobFromFile("pictures" , user_id, tempFilePath, function(error){
			if(!error){
				console.log("profile picture stored!");
				res.send(200,[{ status:"OK"}]);
			}else{
				console.log("profile picture upload blob error",error);
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
