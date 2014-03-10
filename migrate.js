/**
 * Module dependencies.
 */

console.log("Initializing node: " + new Date());
var config = require('./config.js');
var azure = require("azure");
var fs=require('fs');
var async = require('async');
var ChatwalaMessageDocuments = require('./api/messagesAPI/ChatwalaMessageDocuments.js');
var SASHelper = require('./api/SASHelper.js');
var GUIDUtil = require('GUIDUtil');

var rimraf = require('rimraf');
var AdmZip = require('adm-zip');
var archiver = require('archiver');

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

function Migrate() {

    var currentList =[];
    var currentSplit=[];
    var currentStartIndex=0;
    var fullList=null;
    var maxSize=100;
    var marker=null;
    var numBlobs=0;

    this.do=function(){
        getBlobs(null);
    }


    function getShortenedList(blobs, startIndex) {

        var newArray =[];
        var index=startIndex;
        for(i=0; i<maxSize && index<blobs.length; i++, index++) {
            newArray[i] = blobs[index];
        }
        return newArray;
    }

    var getBlobs=function(currentMarker) {
        var options= {};
        if(currentMarker) {
            options.marker=currentMarker;
        }
        oldBlobService.listBlobs("messages",options,function(error, blobs, continuation, response){
            console.log("listBlobs"+ blobs.length);
            if(!error){
                fullList = blobs;
                numBlobs+= fullList.length;
                marker = continuation.nextMarker;
                migrateNext();
            }
        });
    }

    var numMigrated=0;
    var migrateShortenedList = function(list) {
        numMigrated+=list.length;
        var migrateBunchOfWalas = new MigrateBunchOfWalas();
        migrateBunchOfWalas.migrate(list, function() {
            migrateNext();
        });
    }

    var migrateNext=function() {
        console.log("Migrate.migrateNext startIndex=" + currentStartIndex)
        var list = getShortenedList(fullList, currentStartIndex);
        currentStartIndex+=maxSize;
        if(list.length==0) {  //all done, go to next marker
            currentStartIndex=0;
            if(marker){
                getBlobs(marker);
            }
            else {
                console.log("done migrating, numBlobs=" +numBlobs + " numMigrated=" + numMigrated);
            }
        }
        else {

            migrateShortenedList(list);
        }

    }
}

function MigrateBunchOfWalas() {


    this.migrate=function(arrayOfWalas, doneCallback) {
        async.each(arrayOfWalas,
            function(item, nextCallback){
                console.log('handling item');
                var migrateSingleWala = new MigrateSingleWala(item, nextCallback);
                migrateSingleWala.do();
            },
            function(err) {
                if(!err) {
                    doneCallback();
                }
            }
        )
    }
}

function MigrateSingleWala(currentItem, doneCallback) {

    var seriesCallback=null;
    var file;
    var timestamp;
    var senderId;
    var recipientId;
    var startRecording;
    var threadIndex;
    var threadId;
    var newMetaData;
    var messageId;
    var tempFolder;
    var zip;

    this.do = function() {
        console.log("MigrateSingleWala.do");
        async.series([
            setSeriesCallback,
            checkForExistance,
            createTempFolder,
            downloadBlob,
            prepare,
            postToDB,
            createNewZip,
            postToStorage,
            markAsUploaded,
            deleteFiles
        ],
        function(err, results) {
            console.log("MigrateSingleWala, done");
           doneCallback();
        });

    }


    var setSeriesCallback = function(callback) {
        seriesCallback = callback;
        seriesCallback();
    }

    var createTempFolder= function() {
        tempFolder = './downloaded/' + GUIDUtil.GUID();
        fs.mkdir(tempFolder, function(error){
            if(!error) {
                seriesCallback(null, null);
            }
            else {
                console.log(error);
                seriesCallback(error, null);
            }
        });
    }

    var downloadBlob = function()  {
        file =  tempFolder + "/" + currentItem.name + ".zip";
        oldBlobService.getBlobToStream(config.azure.oldStorage.container
            , currentItem.name
            , fs.createWriteStream(file)
            , function(error){
                if(!error){
                    // Wrote blob to stream
                    console.log("downloaded blob");
                    seriesCallback();
                }
                else {
                    console.log("download error " + error);
                    seriesCallback(error);
                }
            });
    }


    var prepare=function() {
        try {
            console.log("MigrateSingleWala.prepare  id=" + currentItem.name);
            zip = new AdmZip(file);
            var metaDataJSON = JSON.parse(zip.readAsText("metadata.json"));

            console.log(metaDataJSON);
            timestamp = getTimestamp(metaDataJSON);
            senderId = getSenderId(metaDataJSON);
            recipientId = getRecipientId(metaDataJSON);
            startRecording = getStartRecording(metaDataJSON);
            threadIndex = getThreadIndex(metaDataJSON);
            threadId = getThreadId(metaDataJSON);
            messageId = currentItem.name;

            if(threadId==null) {
                threadId= messageId;
            }

            newMetaData = null;
            seriesCallback();

        }
        catch(e) {
            seriesCallback(e);
        }
    }

    var checkForExistance=function() {
        CWMongoClient.getConnection(function (err, db) {
            if (err) {
                seriesCallback(err, null);
            } else {
                var collection = db.collection('messages');
                var query = {};
                query[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.MESSAGE_ID] = messageId;
                collection.find(
                    query,
                    function(err, cursor) {
                        if(!err) {
                            cursor.nextObject(function(err, document) {
                                console.log("Message already in database, so go fuck off!");
                                seriesCallback("failure",null);
                            });
                        }
                        else{
                            seriesCallback();
                        }
                    }
                );
            }
        });
    }

    var createNewZip=function() {
        console.log("MigrateSingleWala.createNewZip");
        //extract the blob
        zip.extractAllTo(tempFolder + "/old", true);
        console.log(newMetaData);
        fs.writeFile(tempFolder + '/metadata.json', JSON.stringify(newMetaData, null, 4), function(err) {
            if(!err) {
                console.log("new meta data file created and saved somewhere");

                var output = fs.createWriteStream(tempFolder+"/chat.zip");
                var archive = archiver('zip');

                output.on('close', function() {
                    console.log(archive.pointer() + ' total bytes');
                    console.log('archiver has been finalized and the output file descriptor has closed.');
                    seriesCallback();
                });

                archive.on('error', function(err) {
                    console.log(err);
                });

                archive.pipe(output);

                archive
                    .append(fs.createReadStream(tempFolder+"/metadata.json"), { name: 'metadata.json' })
                    .append(fs.createReadStream(tempFolder+"/old/video.mp4"), { name: 'video.mp4' })
                    .finalize();


            }
            else {
                console.log(err);
                seriesCallback();
            }
        });


    }

    var postToStorage=function() {

        console.log("MigrateSingleWala.postStorage");
        newBlobService.createBlockBlobFromFile(config.azure.blobStorageShard.s1.container
            , messageId
            , tempFolder+"/chat.zip"
            , function(error){
                if(!error){
                    console.log("file has been uploaded");
                }
               seriesCallback();
            })

    }

    var asyncPostCallback=null;

    var setAsyncPostCallback = function(callback) {
        asyncPostCallback = callback;
        asyncPostCallback();
    }


    var createNewStarter= function() {

        console.log("MigrateSingleWala.createNewStarter");
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
                    asyncPostCallback(err);
                } else {
                    var collection = db.collection('messagesTemp');

                    collection.insert(message.properties,
                        function (err, doc) {
                            if(!err) {
                                console.log("message migrated to messagesTemp table");
                            }
                            else {
                                console.log(err);
                            }
                            asyncPostCallback();
                        });
                }
            });
        }
    }

    var createSender= function() {

        console.log("MigrateSingleWala.createSender");
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
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.SHOWABLE]=false;
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.UPLOADED]=false;
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.TIMESTAMP]=timestamp;
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.VERSION]=ChatwalaMessageDocuments.VERSION_OLD;
        message.generateBlobShardKey();
        message.generateMessageInstanceId();

        newMetaData = ChatwalaMessageDocuments.createMetaDataJSON(message.properties, false);

        if(message.isValid()) {
            CWMongoClient.getConnection(function (err, db) {
                if (err) {
                    console.log("error connecting to db");
                    asyncPostCallback(err);
                } else {
                    var collection = db.collection('messagesTemp');

                    collection.insert(message.properties,
                        function (err, doc) {
                            if(!err) {
                                console.log("sender message migrated to messagesTemp table");
                            }
                            else {
                                console.log(err);
                            }
                            asyncPostCallback();
                        });
                }
            });
        }
    }

    var createRecipient= function()  {
        console.log("MigrateSingleWala.createRecipient");
        var message = new ChatwalaMessageDocuments.Message();
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
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.SHOWABLE]=false;
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.UPLOADED]=false;
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.TIMESTAMP]=timestamp;
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.VERSION]=ChatwalaMessageDocuments.VERSION_OLD;
        message.generateBlobShardKey();
        message.generateMessageInstanceId();


        if(message.isValid()) {
            CWMongoClient.getConnection(function (err, db) {
                if (err) {
                    console.log("error connecting to db");
                    asyncPostCallback(err);
                } else {
                    var collection = db.collection('messagesTemp');

                    collection.insert(message.properties,
                        function (err, doc) {
                            if(!err) {
                                console.log("recipient message migrated to messagesTemp table");
                            }
                            else {
                                console.log(err);
                            }
                            asyncPostCallback();
                        });
                }
            });
        }
    }

    var postToDB=function() {

        console.log("MigrateSingleWala.postToDB");
        var postFunctionArray = [setAsyncPostCallback];


        if(recipientId=="unknown_recipient") {
            //if recipient is unknown, just create 1 entry and call it unknown recipient starter
            postFunctionArray.push(createNewStarter);
        }
        else {
            //create two entries for each message - 1 for the sender, 1 for the recipient, showable =true, uploaded=true
            //create entry 1:
            //if threadIndex is 0 call it threadstarter, showable=false

            //sender
            postFunctionArray.push(createSender());

            //recipient
            postFunctionArray.push(createRecipient());
        }



        async.series(
            postFunctionArray,
            function(err) {
                seriesCallback(err);
            }
        );

    }

    var markAsUploaded=function() {
        console.log("MigrateSingleWala.markAsUploaded");
        CWMongoClient.getConnection(function (err, db) {
            if (err) {
                seriesCallback(err, null);
            } else {
                var collection = db.collection('messages');
                var query = {};
                query[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.MESSAGE_ID] = messageId;
                collection.update(
                    query,
                    {"$set":{"uploaded":true, "showable":true}},
                    {"multi":true, "new":true},
                    function(err, numberTouched) {
                        console.log("documents marked as uploaded")
                        seriesCallback();
                    }
                );
            }
        });

    }

    var deleteFiles=function() {
        console.log("*********************MigrateSingleWala.deleteFiles");
        rimraf(tempFolder, function (err) {
            console.log("*********************MigrateSingleWala.deleteFiles, error=" + err);
            seriesCallback();
        });

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

}

var asyncCallback=null;

function migrate() {
    console.log("migrate called");
    initializeOldBlobService();
    initializeNewBlobService();
    var m = new Migrate();
    m.do();
}

migrate();


