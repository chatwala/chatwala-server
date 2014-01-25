var CWMongoClient = require('../cw_mongo.js');
var format = require('util').format;
var GUIDUtil = require('GUIDUtil');
var config = require('../config.json');
var utility = require('../utility');
var fs = require("fs");
var azure = require('azure');
var hub = azure.createNotificationHubService('chatwala-dev-push', "sb://chatwala-dev-push-ns.servicebus.windows.net/","DefaultFullSharedAccessSignature", "JafmIo0Vf5WEDxikPZZupFNxHvp13nJ5bGXIGrFs/mw=");


function registerNewUserWithPush( req, res){

	if(req.hasOwnProperty('body')){
		console.log("getting into registerNewUserWithPush...");
		if(req.body.platform_type && req.body.user_id && req.body.push_token){

			var platform_type = req.body.platform_type;
			var user_id = req.body.user_id;
			var push_token = req.body.push_token;

			if(platform_type === 'ios'){
				//console.log("Platform_type is equal to ios");
				//storePushCertToDB(user_id, push_token, function(err, user){
					//if(!err){
				//		try{
			
			
			// Function called when registration is completed.
			var registrationComplete = function(error, registration) {
				if (!error) {
					// Return the registration.
					response.send(200, registration);
				} else {
					response.send(500, 'Registration failed!');
				}
			}
			
			// Get existing registrations.
				hub.listRegistrationsByTag(user_id, function(error, existingRegs) {
					var firstRegistration = true;
					if (existingRegs.length > 0) {
						 for (var i = 0; i < existingRegs.length; i++) {
							if (firstRegistration) {
								// Update an existing registration.
								if (platform_type === 'ios') {
									existingRegs[i].DeviceToken = push_token;
									hub.updateRegistration(existingRegs[i], registrationComplete);
								} else {
									response.send(500, 'Unknown client.');
								}
								firstRegistration = false;
							} else {
								// We shouldn't have any extra registrations; delete if we do.
								hub.deleteRegistration(existingRegs[i].RegistrationId, null);
							}
						}
					} else {
						// Create a new registration.
						if (platform_type === 'ios') {
							hub.apns.createNativeRegistration(push_token, 
							[userId], registrationComplete);
						} else {
							response.send(500, 'Unknown client.');
						}
					}
				});			
				
				/*hub.apns.createNativeRegistration(push_token, [user_id], function(error, registration){
					if(error){
						console.log(error);
					}
					else{
						console.log("Successfully registered device token for user: " + user_id);

					}
				})*/
				//}
				
				/*catch(e){
					console.log("error trying to connet to notification service bus")
					console.log(e);
					res.send(500, {"error": e})
				}*/

			
			
			
					/*}
					else{
						console.log("Error assigning user push_token");
					}
				})*/

			}
			else if(platform_type === 'android'){
				console.log("platform_type is android");
				res.send(200, [{'status':'OK'}]);
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
			collection.find({"user_id":user_id, "devices": token_id}, function(err, obj){
				console.log("obj count");
				console.log(obj.count());
				if(err){
					callback(err);
				}
				else if(obj.count() === 0){

					collection.findAndModify({"user_id":user_id},{ $push:{"devices": token_id  }},{},function(err,object){
						if(!err){
							callback(null, object);
						}
						else{
							callback(err);
						}
					})
				}
				else{
					console.log("No need to update user's devices becauase token_id already exists");
					callback(null);
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
exports.registerNewUserWithPush = registerNewUserWithPush;