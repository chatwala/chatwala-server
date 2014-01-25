var CWMongoClient = require('../cw_mongo.js');
var format = require('util').format;
var GUIDUtil = require('GUIDUtil');
var config = require('../config.json');
var utility = require('../utility');
var fs = require("fs");
var azure = require('azure');



function registerNewUserWithPush( req, res){

	if(req.hasOwnProperty('body')){
		console.log("getting into registerNewUserWithPush...");
		if(req.body.platform_type && req.body.user_id && req.body.push_token){
			console.log(req.body);
			var platform_type = req.body.platform_type;
			var user_id = req.body.user_id;
			var push_token = req.body.push_token;

			if(platform_type === 'ios'){
				storePushCertToDB(user_id, push_token, function(err, user){
					if(!err){

						var payload = {
							alert: "Hello!"
						}

						var hub = azure.createNotificationHubService('chatwala-dev-push');
						hub.apns.send(user.devices[0], payload, function(err){
							if(err){
								console.log("Error sending APNS payload to " + user_id);
								console.log(err);
							}
							else{
								console.log('hitting registerNewUserWithPush for ios client');
								res.send(200,{"status":"OK"});
							}
						})
					}
					else{
						console.log("Error assigning user push_token");
					}
				})

			}
			else if(platform_type === 'android'){
			}
		}
		else{
			console.log("error on registerNewUserWithPush: all body values not defined");
			res.send(400,[{ error:"need body fields set"}]);
		}

	}
	else{
		console.log("Error on registerNewUserWithPush : no body");
		res.send(400, [{ error:"need body"}]);
	}


}

function storePushCertToDB( user_id, token_id, callback){
	CWMongoClient.getConnection(function (err, db) {
		if (err) { 
			callback(error); 
		} 
		else {
			var collection = db.collection('users');
			collection.findAndModify({"user_id":user_id},{ $push:{"devices": token_id  }},{},function(err,object){
				if(!err){
					callback(null, object);
				}
				else{
					callback(err);
				}
			})
		}
	});
}

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