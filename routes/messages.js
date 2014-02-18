var fs = require("fs");
var azure = require("azure");
var GUIDUtil = require('GUIDUtil');
var os = require("os");
var CWMongoClient = require('../cw_mongo.js');
var config = require('../config.js')();
var hub = azure.createNotificationHubService(config.azure.hub_name, config.azure.hub_endpoint, config.azure.hub_keyname, config.azure.hub_key);

var NO_FILES = "files not found";
var NO_BODY = "no post information found for POST /messages";

var utility = require('../utility');

function compareMessageMetadata(a, b) {
    if (a.timestamp < b.timestamp)
        return 1;
    if (a.timestamp > b.timestamp)
        return -1;
    return 0;
}

/**
 Returns List of User's Messages
 **/
function getUserMessages(req, res) {
    var user_id = req.params.user_id;
    var localRes = res;

    CWMongoClient.getConnection(function (err, db) {

        if (err) {
            localRes.send(500, {"error": "unable to fetch messages - database error: " + err});
        } else {
            var collection = db.collection('users');
            collection.findOne({"user_id": user_id}, function (err, user) {

                if (!err && user && user.inbox) {
                    var messages = user.inbox.sort(compareMessageMetadata);
                    console.log("user messages fetched for user: " + user_id);
                    var results = { "user": user_id, "messages": messages};
                    localRes.send(200, results)
                } else {
                    console.log("user does not exist, creating empty inbox");
                    localRes.send(200, { "user": user_id, "messages": []});
                }
            });
        }
    });
}

/**
 Endpoint Handler for saving message meta data and returning the url as well as the upload url
 **/
function postMessage(req, res) {

    if (!req.hasOwnProperty('body')) {
        console.log("postMessage: Error on postMessage : no body");
        res.send(400, [
            { error: "need body"}
        ]);
        return;
    }

    var message_id = req.params.message_id;
    var recipient_id = req.body.recipient_id;
    var sender_id = req.body.sender_id;

    if (typeof message_id === 'undefined') {
        res.send(400, [
            { error: "need message_id"}
        ]);
        return;
    }

    if (typeof recipient_id === 'undefined') {
        res.send(400, [
            { error: "need recipient_id"}
        ]);
        return;
    }

    if (typeof sender_id === 'undefined') {
        res.send(400, [
            { error: "need sender_id"}
        ]);
        return;
    }

    var sasUrl = getSasURL(message_id);

    if (sasUrl) {
        console.log("postMessage: Fetched shared access message url for blob");
        res.send(200, {"status": "OK", 'url': createChatwalaRedirectURL(message_id), 'sasUrl': sasUrl});
    }
    else {
        console.log("postMessage: Unable to retrieve shared access url for message: " + message_id);
        res.send(500, {"status": "FAIL", "message": "Unable to create shared access url for message " + message_id});
    }

    /*
    storeMessageMetadataInDB(message_id, recipient_id, sender_id, host, function (err, url) {
        if (err) {
            res.send(500, {"status": "FAIL", "message": "could not store message metadata"});
        }
        else {
            var sasUrl = getSasURL(message_id);

            if (sasUrl) {
                console.log("Fetched shared access message url for blob - redirecting");
                res.send(200, {"status": "OK", 'url': url, 'sasUrl': sasUrl});
            }
            else {
                console.log("Unable to retrieve shared access url for message: " + message_id);
                res.send(500, {"status": "FAIL", "message": "Unable to create shared access url for message " + message_id});
            }
        }
    });*/
}

function getUploadURL(req, res) {
    var message_id = req.params.message_id;
    var sasUrl = getSasURL(message_id);
    if(sasUrl) {
        res.send(200, {"status":"OK", "sasUrl": sasUrl});
    }
    else {
        console.log("Unable to retrieve shared access url for message: " + message_id);
        res.send(500, {"status": "FAIL", "message": "Unable to create shared access url for message " + message_id});
    }
}

function getSasURL(message_id) {
    //create a SAS that expires in 10 minutes
    var sharedAccessPolicy = {
        AccessPolicy: {
            Permissions: 'rw',
            Expiry: azure.date.minutesFromNow(10)
        }
    };

    var sasUrl = utility.getBlobService().getBlobUrl("messages", message_id, sharedAccessPolicy);
    return sasUrl;
}

function postFinalize(req, res) {

    if (!req.hasOwnProperty('body')) {
        console.log("Error on postFinalize : no body");
        res.send(400, [
            { error: "need body"}
        ]);
        return;
    }

    var message_id = req.params.message_id;
    var recipient_id = req.body.recipient_id;
    var sender_id = req.body.sender_id;
    var host = req.headers.host;
    var app_version = req.headers["x-chatwala-appversion"];

    if (typeof message_id === 'undefined') {
        res.send(400, [
            { error: "need message_id"}
        ]);
        return;
    }

    if (typeof recipient_id === 'undefined') {
        res.send(400, [
            { error: "need recipient_id"}
        ]);
        return;
    }

    if(recipient_id === "unknown_recipient") {
        res.send(200, {"status": "OK", "message": "finalize called for unknown recipient"});
        return;
    }

    var doSilentPush = true;
    if(typeof app_version === 'undefined') {
        doSilentPush = false;
    }

    console.log("app_version=" + app_version);
    console.log("doSilentPush=" + doSilentPush);

    storeMessageMetadataInDB(message_id, recipient_id, sender_id, host, function (err, url) {
        if (err) {
            res.send(500, {"status": "FAIL", "message": "could not store message metadata"});
        }
        else {
            sendPushNotification(recipient_id, doSilentPush, function (err) {
                if(!err) {
                    res.send(200, {"status": "OK", "message": "finalize successfully completed"});
                }
                else {
                    res.send(200, {"status": "OK", "message": "add to DB succeeded but push failed."});
                }
            });
        }
    });


}

/**
 Endpoint Handler for retrieving message file
 **/
function getMessage(req, res) {

    var message_id = req.params.message_id;

    if (typeof message_id === 'undefined') {
        res.send(400, [
            { error: "need message_id"}
        ]);
        return;
    }

    //create a SAS that expires in an hour
    var sharedAccessPolicy = {
        AccessPolicy: {
            Permissions: 'r',
            Expiry: azure.date.minutesFromNow(60)
        }
    };

    var sasUrl = utility.getBlobService().getBlobUrl("messages", message_id, sharedAccessPolicy);

    if (sasUrl) {
        console.log("Fetched shared access message url for blob - redirecting");
        res.writeHead(302, {
            'Location': sasUrl
        });
        res.end();
    }
    else {
        console.log("Unable to retrieve shared access url for message: " + message_id);
        res.send(404);
    }
}


function storeMessageMetadataInDB(message_id, recipient_id, sender_id, host, callback) {
    var message_metadata = {
        "message_id": message_id,
        "recipient_id": recipient_id,
        "sender_id": sender_id,
        "timestamp": Math.round((new Date()).getTime() / 1000),
        "thumbnail": "http://" + host + "/users/" + sender_id + "/picture"

    };

    saveOutGoingMessage(message_metadata, function (err) {
        callback(err, createChatwalaRedirectURL(message_metadata.message_id));
    });
}

function createChatwalaRedirectURL(message_id) {
    return "http://chatwala.com/?" + message_id;
}

/*Deprecated*/
function submitMessageMetadata(req, res) {
    if (req.hasOwnProperty("body")) {

        var recipient_id = req.body.recipient_id;
        var sender_id = req.body.sender_id;
        var message_id = GUIDUtil.GUID();

        storeMessageMetadataInDB(message_id, recipient_id, sender_id, req.headers.host, function (err, url) {
            if (err) {
                res.send(500, {"status": "FAIL", "message": "could not store message data"});
            }
            else {
                console.log("sending response: ", url);
                res.send(200, {"status": "OK", "message_id": message_id, "url": url});
            }
        });

    }
    else {
        console.log("NO_BODY");
        res.send(400, {status: "FAIL", message: "NO_BODY"});
    }
}

function saveOutGoingMessage(message_metadata, callback) {
    CWMongoClient.getConnection(function (err, db) {
        if (err) {
            res.send(500, {"error": "unable to fetch messages - database error: " + err});
        }
        else {
            var collection = db.collection('users');
            var sender_id = message_metadata.sender_id;
            var recipient_id = message_metadata.recipient_id;

            console.log("sender: ", sender_id);
            console.log("locating recipient: ", recipient_id);

            if (message_metadata.recipient_id == "unknown_recipient") {
                callback(null);
            }
            else {
                console.log("saving message: ", message_metadata);
                collection.update(
                    { "user_id": recipient_id},
                    { $push: {"inbox": message_metadata  }},
                    { "upsert": true },
                    function (err, object) {
                        if (!err) {
                            console.log("updated inbox for recipient: " + recipient_id);
                            callback(null);
                        }
                        else {
                            callback("unable to save outbound message - cannot find recipient: ", recipient_id);
                        }
                    }
                );
            }
        }
    });
}

function sendPushNotification(recipient_id, doSilentPush, callback) {
    var message="You have a new message. Downloading now...";
    var templateVariables={"content_available": 1, "message": message};
    var tag = recipient_id;
    
    /*if(doSilentPush) {
        tag = recipient_id + ".silent";
    }*/

    console.log("sendPushNotification: doSilentPush=" + doSilentPush);
    console.log("sendPushNotification: tag=" + tag);

    hub.send(tag, templateVariables, function (err, result, responseObject) {
        if (err) {
            console.log("Error sending APNS payload to " + recipient_id);
            console.log(err);
            callback(err);
        }
        else {
            console.log('successfully sent push notification to user: ' + recipient_id);
            callback(null);
        }
    });
}

/**
 Endpoint Handler for Chatwala File (PUT)
 **/
function putMessage(req, res) {
    // get message_id parameter
    var message_id = req.params.message_id

    if (typeof message_id === 'undefined') {
        res.send(400, [
            { error: "need message_id"}
        ]);
        return;
    }

    // create a temp file
    var tempFilePath = utility.createTempFilePath();
    var file = fs.createWriteStream(tempFilePath);
    var fileSize = req.headers['content-length'];
    var uploadedSize = 0;

    console.log("storing message blob with ID:", message_id);

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
        // save data to blob service with message_id
        utility.getBlobService().createBlockBlobFromFile("messages", message_id, tempFilePath, function (error) {
            if (!error) {
                console.log("message stored!");
                res.send(200, [
                    { status: "OK"}
                ]);
            } else {
                console.log("error", error);
            }
            // delete the temp file
            fs.unlink(tempFilePath, function (err) {

            });
        });
    });
}

exports.submitMessageMetadata = submitMessageMetadata;
exports.putMessage = putMessage;
exports.getMessage = getMessage
exports.postMessage = postMessage;
exports.getUserMessages = getUserMessages;
exports.getUploadURL = getUploadURL;
exports.postFinalize = postFinalize;