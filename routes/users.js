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
}

function updateProfilePicture( req, res ) {
		// get user_id parameter
	var user_id = req.params.user_id;
	var fileSize = req.headers['content-length'];
	
	console.log("Attempting to upload profile picture with content-length: " + fileSize);
	utility.getBlobService().createBlockBlobFromStream("pictures", user_id, req, fileSize, [], function(err, arg1, arg2) {
		if (err) return res.send(404, { error: "error saving profile image" });
		else {
			res.send(200, [{ status:"OK"}]);
		}
	});
}

exports.updateProfilePicture = updateProfilePicture;
exports.getProfilePicture = getProfilePicture;
exports.registerNewUser = registerNewUser;
