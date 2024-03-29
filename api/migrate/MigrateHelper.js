/**
 * Created by samirahman on 2/24/14.
 */

var config = require('../../config.js');
var CWMongoClient = require('../../cw_mongo.js');
var azure = require("azure");
var fs=require('fs');
var async = require('async');
var ChatwalaMessageDocuments = require("./../messagesAPI/ChatwalaMessageDocuments.js");
var SASHelper = require('../SASHelper.js');
var GUIDUtil = require('GUIDUtil');

var rimraf = require('rimraf');
var AdmZip = require('adm-zip');
var archiver = require('archiver');


var MigrateHelper=(function() {

    var oldBlobService = null;
    var newBlobService = null;

    var errArray = [];

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

    function MigrateFull() {

        var currentList =[];
        var currentSplit=[];
        var currentStartIndex=0;
        var fullList=null;
        var maxSize=50;
        var marker=null;
        var numBlobs=0;

        this.do=function(){
            getBlobs(null);
        }


        function getShortenedList(blobs, startIndex) {

            var newArray =[];
            var index=startIndex;
            for(i=0; i<maxSize && index<blobs.length; i++, index++) {
                newArray[i] = blobs[index].name;
            }
            return newArray;
        }

        var getBlobs=function(currentMarker) {
            var options= {};
            if(currentMarker) {
                options.marker=currentMarker;
            }
            oldBlobService.listBlobs("messages",options,function(error, blobs, continuation, response){
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
            var m = new MigrateListOfWalas(list, function() {
                migrateNext();
            });
            m.do();
        }

        var migrateNext=function() {
            var list = getShortenedList(fullList, currentStartIndex);
            currentStartIndex+=maxSize;
            if(list.length==0) {  //all done, go to next marker
                currentStartIndex=0;
                if(marker){
                    getBlobs(marker);
                }
                else {
                    console.log("done migrating, numBlobs= " +numBlobs + " numMigrated= " + numMigrated);
                    var timenow = new Date().getTime();
                    console.log("The time completed: " + timenow);
                    console.log("errArray: ");
                    console.log(errArray);
                    
                    return;
                }
            }
            else {

                migrateShortenedList(list);
            }

        }
    }

    function CountFull() {

        var marker=null;
        var numBlobs=0;

        this.do=function(){
            getBlobs(null);
        }

        var getBlobs=function(currentMarker) {
            var options= {};
            if(currentMarker) {
                options.marker=currentMarker;
            }
            //oldBlobService.listBlobs(config.azure.oldStorage.container,options,function(error, blobs, continuation, response){
            newBlobService.listBlobs(config.azure.blobStorageShard.s1.container,options,function(error, blobs, continuation, response){
                if(!error){
                    console.log("Number of Blobs in this batch "+ blobs.length);
                    numBlobs+= blobs.length;
                    marker = continuation.nextMarker;
                    if(!marker){
                        console.log("Total Number of BLOBS : " + numBlobs);
                        return;
                    }
                    getBlobs(marker);
                }
                else{
                    console.log(error);
                }
            });
        }

    }


    function MigrateListOfWalas(arrayOfWalaIds, doneCallback) {
        this.do=function() {
            async.each(arrayOfWalaIds,
                function(messageId, nextCallback){
                    var migrateSingleWala = new MigrateSingleWala(messageId, nextCallback);
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

    function MigrateSingleWala(messageId, doneCallback) {

        var seriesCallback=null;
        var file;
        var timestamp;
        var senderId;
        var recipientId;
        var startRecording;
        var threadIndex;
        var threadId;
        var newMetaData;
        var tempFolder;
        var zip;
        var storedMessage;

        this.do = function() {
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
                    doneCallback();
                });

        }


        var setSeriesCallback = function(callback) {
            seriesCallback = callback;
            seriesCallback();
        }

        var checkForExistance=function() {
            CWMongoClient.getConnection(function (err, db) {
                if (err) {
                    seriesCallback(err, null);
                } else {
                    var collection = db.collection('messages');
                    var query = {};
                    query[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.MESSAGE_ID] = messageId;
                    //query[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.UPLOADED] = false;

                    collection.find(
                        query,
                        function(err, cursor) {

                            if(!err) {
                                cursor.nextObject(function(err, document) {
                                    if(document){
                                        if(document[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.UPLOADED]===true) {
                                            seriesCallback("failure",null);

                                        }
                                        else {
                                            errArray.push({"cause":"exists & uploaded=false","message_id":messageId});
                                            storedMessage = document;
                                            seriesCallback();
                                        }
                                    }
                                    else {
                                        seriesCallback();
                                    }
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
            file =  tempFolder + "/" + messageId + ".zip";
            oldBlobService.getBlobToStream(config.azure.oldStorage.container
                , messageId
                , fs.createWriteStream(file)
                , function(error){
                    if(!error){
                        // Wrote blob to stream
                        seriesCallback();
                    }
                    else {
                        console.log("download error " + error);
                        errArray.push({"cause":"download error","message_id":messageId});
                        seriesCallback(error);
                    }
                });
        }


        var prepare=function() {
            try {
                zip = new AdmZip(file);
                var metaDataJSON = JSON.parse(zip.readAsText("metadata.json"));

                timestamp = getTimestamp(metaDataJSON);
                senderId = getSenderId(metaDataJSON);
                recipientId = getRecipientId(metaDataJSON);
                startRecording = getStartRecording(metaDataJSON);
                threadIndex = getThreadIndex(metaDataJSON);
                threadId = getThreadId(metaDataJSON);


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


        var postToDB=function() {


            //the message is already stored in the database, but it failed to upload, so dont restore it, just put to blob
            if(storedMessage) {
                seriesCallback();
                return;
            }

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

        var createNewZip=function() {
            //extract the blob
            zip.extractAllTo(tempFolder + "/old", true);
            fs.writeFile(tempFolder + '/metadata.json', JSON.stringify(newMetaData, null, 4), function(err) {
                if(!err) {


                    var output = fs.createWriteStream(tempFolder+"/chat.zip");
                    var archive = archiver('zip');

                    output.on('close', function() {
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

            newBlobService.createBlockBlobFromFile(config.azure.blobStorageShard.s1.container
                , messageId
                , tempFolder+"/chat.zip"
                , function(error){
                    if(error){
                        errArray.push({"cause":"failure to put", "message_id":messageId});
                    }
                     seriesCallback();
                })

        }


        var markAsUploaded=function() {
            CWMongoClient.getConnection(function (err, db) {
                if (err) {
                    seriesCallback(err, null);
                } else {
                    var collection = db.collection('messages');
                    var query = {};
                    query[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.MESSAGE_ID] = messageId;

                    var update = {};
                    update["uploaded"] = true;
                    update["showable"] = true;
                    update["last_modified"] = new Date().getTime();

                    collection.update(
                        query,
                        {"$set":update},
                        {"multi":true, "new":true},
                        function(err, numberTouched) {
                            seriesCallback();
                        }
                    );
                }
            });

        }

        var asyncPostCallback=null;

        var setAsyncPostCallback = function(callback) {
            asyncPostCallback = callback;
            asyncPostCallback();
        }


        var createNewStarter= function() {

            var message = ChatwalaMessageDocuments.createNewStarterUnknownRecipientMessage(messageId, senderId);
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.THREAD_ID]=threadId;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.GROUP_ID]=threadId;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.VERSION] =ChatwalaMessageDocuments.VERSION_OLD;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.TIMESTAMP] = timestamp;
            message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.BLOB_STORAGE_SHARD_KEY] = SASHelper.getCurrentShardKey();

            newMetaData = ChatwalaMessageDocuments.createMetaDataJSON(message.properties, false);
            newMetaData[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.VERSION] = ChatwalaMessageDocuments.VERSION_OLD;

            if(message.isValid()) {
                CWMongoClient.getConnection(function (err, db) {
                    if (err) {
                        console.log("error connecting to db");
                        asyncPostCallback(err);
                    } else {
                        var collection = db.collection('messages');

                        message.properties["last_modified"] = new Date().getTime();

                        collection.insert(message.properties,
                            function (err, doc) {
                                if(err) {
                                    console.log(err);
                                }
                                asyncPostCallback();
                            });
                    }
                });
            }
        }

        var createSender= function() {

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
            newMetaData[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.VERSION] = ChatwalaMessageDocuments.VERSION_OLD;


            if(message.isValid()) {
                CWMongoClient.getConnection(function (err, db) {
                    if (err) {
                        console.log("error connecting to db");
                        asyncPostCallback(err);
                    } else {
                        var collection = db.collection('messages');

                        message.properties["last_modified"] = new Date().getTime();

                        collection.insert(message.properties,
                            function (err, doc) {
                                if(err) {
                                    console.log(err);
                                }
                                asyncPostCallback();
                            });
                    }
                });
            }
        }

        var createRecipient= function()  {
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
                        var collection = db.collection('messages');

                        message.properties["last_modified"] = new Date().getTime();

                        collection.insert(message.properties,
                            function (err, doc) {
                                if(err) {
                                    console.log(err);
                                }
                                asyncPostCallback();
                            });
                    }
                });
            }
        }




        var deleteFiles=function() {
            rimraf(tempFolder, function (err) {
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
                var date = new Date(timestamp);
                timestamp = date.getTime();
            }
            else { //its an integer, now check if its in seconds or millis
                var now = new Date();

                if(timestamp*1000>now.getTime()) { //its in millis
                    //do nothing
                }
                else { //its in seconds
                    timestamp = timestamp*1000; //now its in millis
                }
            }
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
            if(sender_id==null) {
                return null;
            }
            else {
                return sender_id;
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
            return recipient_id;
        }


        function getStartRecording(metaDataJSON) {
            var start_recording=0;
            if(metaDataJSON.start_recording) {
                start_recording = metaDataJSON.start_recording;
            }
            else if(metaDataJSON.startRecording) {
                start_recording = metaDataJSON.startRecording;
            }
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
                return thread_id;
            }

        }

    }

    function countOldBlobs(){
        initializeNewBlobService();
        //initializeOldBlobService();
        var c = new CountFull();
        c.do();
    }

    function migrateSingleWala(messageId, callback) {
        initializeNewBlobService();
        initializeOldBlobService();
        var m = new MigrateSingleWala(messageId, callback);
        m.do();
    }

    function migrateListOfWalas(arrayOfMessageIds, callback) {
        initializeNewBlobService();
        initializeOldBlobService();
        var m = new MigrateListOfWalas(arrayOfMessageId, callback);
        m.do();
    }

    function migrateAllWalas() {
        initializeNewBlobService();
        initializeOldBlobService();
        var m = new MigrateFull();
        m.do();
    }

    function postMigrateMessageToQueue(messageId) {

    }

    function startListeningForMigrateMessages() {

    }

    var postSingleWalaToStorage=function(message_id) {

        var account = config.azure.blobStorageShard.s1.storage_name;
        var access_key = config.azure.blobStorageShard.s1.storage_key;
        var bs = azure.createBlobService(account, access_key);

        bs.createBlockBlobFromFile(config.azure.blobStorageShard.s1.container
            , message_id
            ,"./temp/" + message_id
            , function(error){
                if(error){
                    console.log("Error uploading single wala");
                    console.log(error);
                }
                else{
                    console.log("Successfully uploaded single wala : " + message_id);
                    return;
                }
            })

    }

    return {
        "migrateSingleWala": migrateSingleWala,
        "migrateListOfWalas": migrateListOfWalas,
        "migrateAllWalas": migrateAllWalas,
        "postMigrateMessageToQueue": postMigrateMessageToQueue,
        "startListeningForMigrateMessages": startListeningForMigrateMessages,
        "countOldBlobs":countOldBlobs,
        "postSingleWalaToStorage":postSingleWalaToStorage
    }

}());

module.exports = MigrateHelper;