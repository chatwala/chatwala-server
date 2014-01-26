var CWMongoClient = require('../cw_mongo.js');
var format = require('util').format;
var GUIDUtil = require('GUIDUtil');
var config = require('../config.js')();
var utility = require('../utility');
var fs = require("fs");
var azure = require('azure');
var hub = azure.createNotificationHubService(config.azure.hub_name, config.azure.hub_endpoint,config.azure.hub_keyname,config.azure.hub_key);


function createGUID(){
	return GUIDUtil.GUID();
}

function registerPush(user_id, platform_type, push_token, callback){

	// Get existing registrations.
	hub.listRegistrationsByTag(user_id, function(error, existingRegs) {
		var firstRegistration = true;
		if (existingRegs.length > 0) {
			 for (var i = 0; i < existingRegs.length; i++) {
				if (firstRegistration) {
					// Update an existing registration.
					if (platform_type === 'ios') {
						existingRegs[i].DeviceToken = push_token;
						hub.updateRegistration(existingRegs[i], callback);
					} 
					else if(platform_type === 'android'){
						console.log("platform_type is android");
						callback("push notifcation update for android");
					}
					else {
						callback("push notification update for another platform");
					}
					firstRegistration = false;
				} else {
					// We shouldn't have any extra registrations; delete if we do.
					hub.deleteRegistration(existingRegs[i].RegistrationId, callback);
				}
			}
		} 
		else {
			// Create a new registration.
			if (platform_type === 'ios') {
				
				console.log("Starting APNS registration.");
				var template = '{\"aps\":{\"alert\":\"$(message)\", \"content-available\":\"$(content_available)\"}}';
				hub.apns.createTemplateRegistration(push_token, 
				[user_id], template, callback);
			} 
			else if(platform_type === 'android'){
				//insert android register push notification code here
				callback("new registration for android")
			}
			else {
				callback("new registration for different platform");
			}
		}
	});		

}

function registerNewUserWithPush( req, res){

	if(req.hasOwnProperty('body')){
		
		if(typeof req.body.user_id === 'undefined') {
			res.send(400,[{ error:"need user id"}]);
		}
		else if(req.body.platform_type && req.body.user_id && req.body.push_token){
			
			var platform_type = req.body.platform_type;
			var user_id = req.body.user_id;
			var push_token = req.body.push_token;			
			
			registerPush(user_id, platform_type, push_token, function(err){
				if(err){
					console.log("Error registering new user for push notifications");
				}
				else{
					console.log("Successfully registered new user for push notifications");
				}
				res.send(200);
			})
		}
		else {
			res.send(200);
		}

	}
	else{
		console.log("Error on registerNewUserWithPush : no body");
		res.send(400, [{ error:"need body"}]);
	}
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
exports.registerNewUserWithPush = registerNewUserWithPush;