var CWMongoClient = require('../cw_mongo.js');
var format = require('util').format;
var GUIDUtil = require('GUIDUtil');
var config = require('../config.js')();
var utility = require('../utility');
var fs = require("fs");
var azure = require('azure');
var hub = azure.createNotificationHubService(config.azure.hub_name, config.azure.hub_endpoint, config.azure.hub_keyname, config.azure.hub_key);


function postPushToken(req, res) {

    if (!req.hasOwnProperty('body')) {
        console.log("Error on registerNewUserWithPush : no body");
        res.send(400, [
            { error: "need body"}
        ]);
        return;
    }

    if (typeof req.body.user_id === 'undefined') {
        res.send(400, [
           { error: "need user id"}
        ]);
        return;
    }

    if (typeof req.body.platform_type === 'undefined') {
        res.send(400, [
            { error: "need platform"}
        ]);
        return;
    }

    if(!(req.body.platform_type === "ios" || req.body.platform_type === "android")) {
        res.send(400, [
            { error: "invalid platform type, must be ios|android"}
        ]);
        return;
    }

    if (typeof req.body.push_token === 'undefined') {
        res.send(400, [
            { error: "need push token"}
        ]);
        return;
    }


    var platform_type = req.body.platform_type;
    var user_id = req.body.user_id;
    var push_token = req.body.push_token;

    // Function called when registration is completed.
    var numRegistrations = 0;
    var numErrors =0;
    var registrationComplete = function (error, registration) {
        numRegistrations++;

        if(error) {
            numErrors++;
        }

        if (numRegistrations==2) {
            res.send(200, {"status":"OK", "message":"user registered to push notifications with " + numErrors + " errors"});
        }
    };

    // Get existing registrations.

    //register for "generic"
    var genericTag = user_id;
    hub.listRegistrationsByTag(genericTag, function (error, existingRegs) {
        var firstRegistration = true;
        if (existingRegs.length > 0) {
            for (var i = 0; i < existingRegs.length; i++) {
                if (firstRegistration) {
                    existingRegs[i].DeviceToken = push_token;
                    hub.updateRegistration(existingRegs[i], registrationComplete);
                    firstRegistration = false;
                } else {
                    // We shouldn't have any extra registrations; delete if we do.
                    hub.deleteRegistration(existingRegs[i].RegistrationId, null);
                }
            }
        } else {

            // Create a new registration.
            if (platform_type === 'ios') {
                console.log("register ios user for generic tag." + genericTag);
                var template = '{\"aps\":{\"alert\":\"$(message)\", \"content-available\":1}}';
                hub.apns.createTemplateRegistration(push_token,
                    [genericTag], template, registrationComplete);
            }
            else if (platform_type === 'android') {
                console.log("register android user for generic tag." + genericTag);
                var template = '{\"message\":\"$(message)\"}';
                hub.gcm.createTemplateRegistration(push_token,
                    [genericTag], template, registrationComplete);
            }
        }
    });

    //register for silent
    var silentTag = user_id + ".silent";
    hub.listRegistrationsByTag(user_id+".silent", function (error, existingRegs) {
        var firstRegistration = true;
        if (existingRegs.length > 0) {
            for (var i = 0; i < existingRegs.length; i++) {
                if (firstRegistration) {
                    existingRegs[i].DeviceToken = push_token;
                    hub.updateRegistration(existingRegs[i], registrationComplete);
                    firstRegistration = false;
                } else {
                    // We shouldn't have any extra registrations; delete if we do.
                    hub.deleteRegistration(existingRegs[i].RegistrationId, null);
                }
            }
        } else {
            // Create a new registration.
            if (platform_type === 'ios') {
                console.log("register ios user for silent tag." + silentTag);
                var template = '{\"aps\":{\"alert\":\"\",\"content-available\":1}}';
                hub.apns.createTemplateRegistration(push_token,
                    [silentTag], template, registrationComplete);
            }
            else if (platform_type === 'android') {
                console.log("register android user for silent tag." + silentTag);
                var template = '{\"message\":\"$(message)\"}';
                hub.gcm.createTemplateRegistration(push_token,
                    [silentTag], template, registrationComplete);
            }
        }
    });

}

/*Deprecated*/
function addPushTokenToDB(user_id, token_id, callback) {
    CWMongoClient.getConnection(function (err, db) {
        if (err) {
            callback(error);
        }
        else {
            var collection = db.collection('users');
            collection.find({"user_id": user_id, "devices": token_id}, function (err, obj) {
                console.log("obj count");
                console.log(obj.count());
                if (err) {
                    callback(err);
                }
                else if (obj.count() === 0) {

                    collection.findAndModify({"user_id": user_id}, { $push: {"devices": token_id  }}, {}, function (err, object) {
                        if (!err) {
                            callback(null, object);
                        }
                        else {
                            callback(err);
                        }
                    })
                }
                else {
                    console.log("No need to update user's devices becauase token_id already exists");
                    callback(null);
                }

            })
        }
    });
}

/*Deprecated*/
function registerNewUser(req, res) {
    var user_id = GUIDUtil.GUID();
    saveNewUser(user_id, function (err, results) {
        if (err) {
            console.log(err);
            res.send(500);
        } else {
            res.send(200, results);
        }
    });
}

/*Deprecated*/
function saveNewUser(user_id, callback) {
    CWMongoClient.getConnection(function (err, db) {
        if (err) {
            callback(error);
        } else {
            var collection = db.collection('users');
            collection.insert({"user_id": user_id, inbox: [], sent: [], emails: [], devices: [] }, function (err, docs) {
                if (!err) {
                    console.log("new user saved in database: " + user_id);
                    callback(null, docs);
                } else {
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
function getProfilePicture(req, res) {
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

function getProfilePictureUploadURL(req, res) {
    var user_id = req.params.user_id;

    //create a SAS that expires in an hour
    var sharedAccessPolicy = {
        AccessPolicy: {
            Permissions: 'rw',
            Expiry: azure.date.minutesFromNow(10)
        }
    };

    var sasUrl = utility.getBlobService().getBlobUrl("pictures", user_id, sharedAccessPolicy);

    if (sasUrl) {
        res.send(200, {"status":"OK", "sasUrl": sasUrl});
    }
    else {
        console.log("Unable to retrieve shared access picture url for user: " + user_id);
        res.send(500, {"status":"FAIL", "message":"Unable to retrieve shared access picture url for user: " + user_id});
    }
}

function updateProfilePicture(req, res) {

    // get user_id parameter
    var user_id = req.params.user_id;
    // create a temp file
    var tempFilePath = utility.createTempFilePath();
    var file = fs.createWriteStream(tempFilePath);

    var fileSize = req.headers['content-length'];
    var uploadedSize = 0;

    // handle data events
    req.on("data", function (chunk) {
        uploadedSize += chunk.length;
        var bufferStore = file.write(chunk);
        if (bufferStore == false)
            req.pause();
    });

    // handle drain events
    file.on('drain', function () {
        req.resume();
    });

    // handle end event
    req.on("end", function () {
        // save data to blob service with user_id
        console.log("saving picture for userid", user_id)
        //first agrument is the container it should prob be "profilePicture" instead of "messages"
        utility.getBlobService().createBlockBlobFromFile("pictures", user_id, tempFilePath, function (error) {
            if (!error) {
                console.log("profile picture stored!");
                res.send(200, [
                    { status: "OK"}
                ]);
            } else {
                console.log("profile picture upload blob error", error);
                res.send(400, [
                    { error: "need image asset"}
                ])
            }
            // delete the temp file
            fs.unlink(tempFilePath, function (err) {

            });
        });
    });
}

exports.updateProfilePicture = updateProfilePicture;
exports.getProfilePicture = getProfilePicture;
exports.registerNewUser = registerNewUser;
exports.postPushToken = postPushToken;
exports.getProfilePictureUploadURL = getProfilePictureUploadURL;