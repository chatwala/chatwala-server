/**
 * Module dependencies.
 */

console.log("Initializing node: " + new Date());
var config = require('./config.js');
var azure = require("azure");
var fs=require('fs');
var AdmZip = require('adm-zip');
var archiver = require('archiver');
var async = require('async');
var ChatwalaMessageDocuments = require('./api/messagesAPI/ChatwalaMessageDocuments.js');
var SASHelper = require('./api/SASHelper.js');


"use strict";

var CWMongoClient = require('./cw_mongo.js');



var http = require('http');
var path = require('path');

var queue = [];
// all environments

CWMongoClient.getConnection(function (err, db) {
    if (err) {
        console.log("Unable to connect to mongo DB.");
        queue.forEach(function (object) {
            object.res.send(500);
        });
    } else {
        console.log("Launching queued requests");
        queue.forEach(function (object) {
            object.next();
        });
    }

    queue = [];
});



var oldBlobService = null;
var newBlobService = null;

function initializeOldBlobService() {
    if (oldBlobService == null) {
        var account = config.azure.oldStorage.storage_name;
        var access_key = config.azure.oldStorage.storage_key;
        oldBlobService = azure.createBlobService(account, access_key);
    }
    return oldBlobService;
};

function initializeNewBlobService() {
    if (newBlobService == null) {
        var account = config.azure.blobStorageShard.s1.storage_name;
        var access_key = config.azure.blobStorageShard.s1.storage_key;
        newBlobService = azure.createBlobService(account, access_key);
    }
    return newBlobService;
};

var asyncCallback=null;

function migrate() {
    console.log("migrate called");
    initializeOldBlobService();
    initializeNewBlobService();

    oldBlobService.listBlobs("messages", function(error, blobs){
        console.log("listBlobs");
        if(!error){
            async.eachSeries(blobs, function(item, callback){
                asyncCallback = callback;
                downloadBlob(item.name);
            },
            function(err) {
                if(!err) {
                    console.log("COMPLETED!");
                }
            }
            )
        }
    });
}

function downloadBlob(name) {
    console.log("*************************************************************** attempting to download" + name);
    var file = './downloaded/output.zip';
    oldBlobService.getBlobToStream(config.azure.oldStorage.container
        , name
        , fs.createWriteStream(file)
        , function(error){
            if(!error){
                // Wrote blob to stream
                console.log("wrote blob");
                unzipFile(file, name.toLowerCase());
            }
            else {
                console.log("donwload error " + error);
            }
        })
}

function unzipFile(file, messageId) {
    try {
        var zip = new AdmZip(file);
        var metaDataJSON = JSON.parse(zip.readAsText("metadata.json"));

        console.log(metaDataJSON);
        var timestamp = getTimestamp(metaDataJSON);
        var senderId = getSenderId(metaDataJSON);
        var recipientId = getRecipientId(metaDataJSON);
        var startRecording = getStartRecording(metaDataJSON);
        var threadIndex = getThreadIndex(metaDataJSON);
        var threadId = getThreadId(metaDataJSON);

        if(threadId==null) {
            threadId= messageId;
        }

        var newMetaData = null;
        if(recipientId=="unknown_recipient") {
            //if recipient is unknown, just create 1 entry and call it unknown recipient starter
            var message = ChatwalaMessageDocuments.createNewStarterUnknownRecipientMessage(messageId, senderId);
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.THREAD_ID]=threadId;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.GROUP_ID]=threadId;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.VERSION] =ChatwalaMessageDocuments.VERSION_OLD;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.TIMESTAMP] = timestamp;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.BLOB_STORAGE_SHARD_KEY] = SASHelper.getCurrentShardKey();

            newMetaData = ChatwalaMessageDocuments.createMetaDataJSON(message.properties, false);

            if(message.isValid()) {
                CWMongoClient.getConnection(function (err, db) {
                    if (err) {
                       console.log("error connecting to db");
                    } else {
                        var collection = db.collection('messagesTemp');

                        collection.insert(message.properties,
                            function (err, doc) {
                                if(!err) {
                                    console.log("message migrated to messagesTemp table");
                                }
                            });
                    }
                });
            }
        }
        else {
            //create two entries for each message - 1 for the sender, 1 for the recipient, showable =true, uploaded=true
            //create entry 1:
            //if threadIndex is 0 call it threadstarter, showable=false

            //sender
            var message = new ChatwalaMessageDocuments.Message();
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.MESSAGE_ID]=messageId;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OWNER_USER_ID]=senderId;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OWNER_ROLE]=ChatwalaMessageDocuments.ROLE_SENDER;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OTHER_USER_ID]=recipientId;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OTHER_USER_ROLE]=ChatwalaMessageDocuments.ROLE_RECIPIENT;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.SENDER_ID]=senderId;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.RECIPIENT_ID]=recipientId;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.THREAD_INDEX]=threadIndex;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.THREAD_ID]=threadId;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.THREAD_STARTER]=threadIndex==0;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.START_RECORDING]=startRecording;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.GROUP_ID]=threadId;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.REPLYING_TO_MESSAGE_ID]=null;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.UNKNOWN_RECIPIENT_STARTER]=false;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.SHOWABLE]=true;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.UPLOADED]=true;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.TIMESTAMP]=timestamp;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.VERSION]=ChatwalaMessageDocuments.VERSION_OLD;
            message.generateBlobShardKey();
            message.generateMessageInstanceId();


            if(message.isValid()) {
                CWMongoClient.getConnection(function (err, db) {
                    if (err) {
                        console.log("error connecting to db");
                    } else {
                        var collection = db.collection('messagesTemp');

                        collection.insert(message.properties,
                            function (err, doc) {
                                if(!err) {
                                    console.log("sender message migrated to messagesTemp table");
                                }
                            });
                    }
                });
            }

            //recipient
            message = new ChatwalaMessageDocuments.Message();
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.MESSAGE_ID]=messageId;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OWNER_USER_ID]=recipientId;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OWNER_ROLE]=ChatwalaMessageDocuments.ROLE_RECIPIENT;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OTHER_USER_ID]=senderId;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OTHER_USER_ROLE]=ChatwalaMessageDocuments.ROLE_SENDER;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.SENDER_ID]=senderId;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.RECIPIENT_ID]=recipientId;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.THREAD_INDEX]=threadIndex;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.THREAD_ID]=threadId;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.THREAD_STARTER]=threadIndex==0;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.START_RECORDING]=startRecording;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.GROUP_ID]=threadId;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.REPLYING_TO_MESSAGE_ID]=null;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.UNKNOWN_RECIPIENT_STARTER]=false;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.SHOWABLE]=true;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.UPLOADED]=true;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.TIMESTAMP]=timestamp;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.VERSION]=ChatwalaMessageDocuments.VERSION_OLD;
            message.generateBlobShardKey();
            message.generateMessageInstanceId();


            if(message.isValid()) {
                CWMongoClient.getConnection(function (err, db) {
                    if (err) {
                        console.log("error connecting to db");
                    } else {
                        var collection = db.collection('messagesTemp');

                        collection.insert(message.properties,
                            function (err, doc) {
                                if(!err) {
                                    console.log("recipient message migrated to messagesTemp table");
                                }
                            });
                    }
                });
            }


            newMetaData = ChatwalaMessageDocuments.createMetaDataJSON(message.properties, false);

        }

        //extract the blob
        zip.extractAllTo('./downloaded/outputold', true);
        console.log(newMetaData);
        fs.writeFile('./downloaded/metadata.json', JSON.stringify(newMetaData, null, 4), function(err) {
            if(!err) {
                console.log("new meta data file created and saved somewhere");

                var output = fs.createWriteStream("./downloaded/chat.zip");
                var archive = archiver('zip');

                output.on('close', function() {
                    console.log(archive.pointer() + ' total bytes');
                    console.log('archiver has been finalized and the output file descriptor has closed.');


                        newBlobService.createBlockBlobFromFile(config.azure.blobStorageShard.s1.container
                            , messageId
                            , './downloaded/chat.zip'
                            , function(error){
                                if(!error){
                                    console.log("FILE HAS BEEN UPLOADED!");
                                }
                                asyncCallback(null,null);
                            })

                });

                archive.on('error', function(err) {
                    throw err;
                });

                archive.pipe(output);

                archive
                    .append(fs.createReadStream("./downloaded/metadata.json"), { name: 'metadata.json' })
                    .append(fs.createReadStream("./downloaded/outputold/video.mp4"), { name: 'video.mp4' })
                    .finalize();


            }
            else {
                console.log(err);
            }
        });

    }
    catch(e) {
        console.log("error found " + e);
    }


}


function getTimestamp(metaDataJSON) {
    var timestamp = null;
    if(metaDataJSON["timestamp"]) {
        timestamp = metaDataJSON["timestamp"];
    }
    else if(metaDataJSON["timeStamp"]) {
        timestamp = metaDataJSON["timeStamp"];
    }

    //now check if timestamp is an integer
    if(isNaN(timestamp)) { //its probably UTC
        console.log("UTC");
        var date = new Date(timestamp);
        console.log(date);
        timestamp = date.getTime();
    }
    else { //its an integer, now check if its in seconds or millis
        var now = new Date();

        if(timestamp*1000>now.getTime()) { //its in millis
            //do nothing
            console.log("MILLIS");
        }
        else { //its in seconds
            console.log("SECONDS");
            timestamp = timestamp*1000; //now its in millis
        }
    }
    console.log("timestamp = " + timestamp);
    return timestamp;
}


function getSenderId(metaDataJSON) {
    var sender_id=null;
    if(metaDataJSON.sender_id) {
        sender_id = metaDataJSON.sender_id;
    }
    else if(metaDataJSON.sender) {
        sender_id = metaDataJSON.sender;
    }
    console.log("sender=" + sender_id);
    if(sender_id==null) {
        return null;
    }
    else {
        return sender_id.toLowerCase();
    }

}

function getRecipientId(metaDataJSON) {
    var recipient_id="unknown_recipient";
    if(metaDataJSON.recipient_id) {
        recipient_id = metaDataJSON.recipient_id;
    }
    else if(metaDataJSON.recipient) {
        recipient_id = metaDataJSON.recipient;
    }
    console.log("Recipient=" + recipient_id);
    return recipient_id.toLowerCase();
}


function getStartRecording(metaDataJSON) {
    var start_recording=0;
    if(metaDataJSON.start_recording) {
        start_recording = metaDataJSON.start_recording;
    }
    else if(metaDataJSON.startRecording) {
        start_recording = metaDataJSON.startRecording;
    }
    console.log("start_recording=" + start_recording);
    return start_recording;
}

function getThreadIndex(metaDataJSON) {
    var thread_index=0;
    if(metaDataJSON.thread_index) {
        thread_index = metaDataJSON.thread_index;
    }
    else if(metaDataJSON.threadIndex) {
        thread_index = metaDataJSON.threadIndex;
    }
    console.log("thread_index=" + thread_index);
    return thread_index;
}

function getThreadId(metaDataJSON) {
    var thread_id=0;
    if(metaDataJSON.thread_id) {
        thread_id = metaDataJSON.thread_id;
    }
    else if(metaDataJSON.thread) {
        thread_id = metaDataJSON.thread;
    }

    if(thread_id==0) {
        return null;
    }
    else {
        return thread_id.toLowerCase();
    }

}


function saveToDatabase() {

}

migrate();
