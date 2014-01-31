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
 Returns User's Inbox
 **/
function getUserInbox(req, res) {
    var user_id = req.params.user_id;
    var limit = req.params.limit? req.params.limit : 100;
    var skip = req.params.skip? req.params.skip : 0;


    CWMongoClient.getConnection(function (err, db) {

        if (err) {
            res.send(500, {"error": "unable to fetch messages - database error: " + err});
        } else {
            var collection = db.collection('messages');
            collection.find({"recipient_id": user_id, "uploaded":true}, function(err, messages) {
                if(!err) {
                    var results= {"user": user_id, "messages": messages};
                    res.send(200, results);
                }
                else {
                    res.send(500);
                }
            }).limit(limit).skip(skip).sort({"timestamp":-1});
        }
    });
}

/**
 Returns User's Outbox
 **/
function getUserOutbox(req, res) {
    var user_id = req.params.user_id;
    var limit = req.params.limit? req.params.limit : 100;
    var skip = req.params.skip? req.params.skip : 0;


    CWMongoClient.getConnection(function (err, db) {

        if (err) {
            res.send(500, {"error": "unable to fetch messages - database error: " + err});
        } else {
            var collection = db.collection('messages');
            collection.find({"sender_id": user_id, "uploaded":true}, function(err, messages) {
                if(!err) {
                    var results= {"user": user_id, "messages": messages};
                    res.send(200, results);
                }
                else {
                    res.send(500);
                }
            }).limit(limit).skip(skip).sort({"timestamp": -1});
        }
    });
}


/**
 Returns User's ConversationStarters
 **/
function getConversationStarters(req, res) {
    var user_id = req.params.user_id;
    var limit = req.params.limit? req.params.limit : 100;
    var skip = req.params.skip? req.params.skip : 0;

    CWMongoClient.getConnection(function (err, db) {

        if (err) {
            res.send(500, {"error": "unable to fetch messages - database error: " + err});
        } else {
            var collection = db.collection('messages');
            collection.find(
                {
                $or:[
                    {"sender_id":user_id, "cloned_message_id":null},
                    {"recipient_id":user_id, "uploaded":true}
                ],
                "conversation_starter":true
                },
                function(err, messages) {
                if(!err) {
                    var results= {"user": user_id, "messages": messages};
                    res.send(200, results);
                }
                else {
                    res.send(500);
                }
            }).limit(limit).skip(skip).sort({"timestamp":-1});
        }
    });
}

/**
 Returns User's Conversations By User
 **/
function getConversationStartersGroupedByUser(req, res) {
    var user_id = req.params.user_id;
    var limit = req.params.limit? req.params.limit : 100;
    var skip = req.params.skip? req.params.skip : 0;

    CWMongoClient.getConnection(function (err, db) {

        if (err) {
            res.send(500, {"error": "unable to fetch messages - database error: " + err});
        } else {
            var collection = db.collection('messages');
            collection.find(
                {
                $or:[
                    {"sender_id":user_id, "cloned_message_id":null},
                    {"recipient_id":user_id, "uploaded":true}
                ],
                "conversation_starter":true
                },
                function(err, messages) {
                    if(!err) {
                        var results= {"user": user_id, "messages": messages};
                        res.send(200, results);
                    }
                    else {
                        res.send(500);
                    }
                })
                .limit(limit)
                .skip(skip)
                .sort({"timestamp":-1})
                .groupBy({
                    "keyf": function(doc){
                        if(doc.recipient_id==user_id) {
                            return {"user":doc.sender_id};
                        }
                        else {
                            return {"user":doc.recipient_id};
                        }
                    }/*,
                    reduce: function ( curr, result ) {
                        result.total += curr.item.qty;
                        result.count++;
                    },
                    initial: { total : 0, count: 0 }*/
                });
        }
    });
}


/**
 Endpoint Handler for saving message meta data and returning the url as well as the upload url
 **/
function postMessage(req, res) {

    if (!req.hasOwnProperty('body')) {
        console.log("Error on postMessage : no body");
        res.send(400, [
            { error: "need body"}
        ]);
        return;
    }

    var message_id = req.params.message_id;
    var file_id = message_id;
    var thread_id = req.body.thread_id ? req.body.thread_id : message_id;
    var thread_count = req.body.thread_count ? req.body.thread_count : 0;

    storeMessageMetadataInDB(req.params.message_id, req.body.recipient_id, req.body.sender_id, file_id, null, thread_id, thread_count, req.body.reply_to_message_id, req.body.start_record_time, req.body.conversation_starter, callback,
        function (err, url) {
            if (err) {
                res.send(500, {"status": "FAIL", "message": "could not store message metadata"});
            }
            else {
                var sasUrl = getSasURL(file_id);

                if (sasUrl) {
                    console.log("Fetched shared access message url for blob - redirecting");
                    res.send(200, {"status": "OK", 'url': url, 'sasUrl': sasUrl});
                }
                else {
                    console.log("Unable to retrieve shared access url for message: " + message_id);
                    res.send(500, {"status": "FAIL", "message": "Unable to create shared access url for message " + message_id});
                }
            }
    });
}

function getUploadURL(req, res) {
    var file_id = req.params.file_id;
    var sasUrl = getSasURL(file_id);
    if(sasUrl) {
        res.send(200, {"status":"OK", "sasUrl": sasUrl});
    }
    else {
        console.log("Unable to retrieve shared access url for message: " + file_id);
        res.send(500, {"status": "FAIL", "message": "Unable to create shared access url for file_id " + file_id});
    }
}

function getSasURL(file_id) {
    //create a SAS that expires in 10 minutes
    var sharedAccessPolicy = {
        AccessPolicy: {
            Permissions: 'rw',
            Expiry: azure.date.minutesFromNow(10)
        }
    };

    var sasUrl = utility.getBlobService().getBlobUrl("messages", file_id, sharedAccessPolicy);
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


    sendPushNotification(recipient_id, function (err) {
        var pushSent = !err;

        CWMongoClient.getConnection(function (err, db) {
            if (err) {
                res.send(500, {"error": "unable to connect to db"});
            }
            else {
                var collection = db.collection('messages');
                collection.update(
                    {"message_id":message_id},
                    {
                        "uploaded":true,
                        "push_sent":pushSent
                    }
                );

            }
        });
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


function storeMessageMetadataInDB(message_id, recipient_id, sender_id, file_id, cloned_message_id, thread_id, thread_count, reply_to_message_id, start_record_time, conversation_starter, callback) {
    var message_metadata = {
        "message_id": message_id,
        "recipient_id": recipient_id,
        "sender_id": sender_id,
        "file_id": file_id,
        "timestamp": Math.round((new Date()).getTime() / 1000),
        "cloned_messaged_id": cloned_message_id,
        "uploaded":false,
        "received": false,
        "viewed": false,
        "push_sent":false,
        "thread_id": thread_id,
        "thread_count": thread_count,
        "reply_to_message_id": reply_to_message_id,
        "start_record_time": start_record_time,
        "conversation_starter": conversation_starter
    };

    saveOutGoingMessage(message_metadata, function (err) {
        callback(err, createChatwalaRedirectURL(message_metadata.message_id));
    });
}

function createChatwalaRedirectURL(message_id) {
    return "http://chatwala.com/?" + message_id;
}


function saveOutGoingMessage(message_metadata, callback) {
    CWMongoClient.getConnection(function (err, db) {
        if (err) {
            res.send(500, {"error": "unable to save message"});
        }
        else {
            var collection = db.collection('messages');
            collection.insert(message_metadata, function(err){
                if(!err) {
                    res.send(200);
                }
                else {
                    res.send(500,{"error": "unable to save message"});
                }
            });
        }
    });
}

function sendPushNotification(recipient_id, callback) {
    var payload = {"content_available": 1, "message": "You have a received a new Chatwala reply."};

    hub.send(recipient_id, payload, function (err, result, responseObject) {
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