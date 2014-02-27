/**
 * Created by samirahman on 2/24/14.
 */

var config = require('../config.js')();
var azure = require('azure');
var ChatwalaMessageDocuments = require("../threadAPI/ChatwalaMessageDocuments.js");

var ThreadHelper=(function() {

    var THREAD_ROLE_STARTER = "THREAD_STARTER";
    var THREAD_ROLE_REPLIER = "THREAD_REPLIER";


    var THREAD_PROPERTIES = {};
    THREAD_PROPERTIES.THREAD_ID="thread_id";
    THREAD_PROPERTIES.OWNER_ID="owner_id";
    THREAD_PROPERTIES.THREAD_INSTANCE_ID="thread_instance_id";
    THREAD_PROPERTIES.OTHER_USER_ID="other_user_id";
    THREAD_PROPERTIES.OWNER_THREAD_ROLE="owner_thread_role";
    THREAD_PROPERTIES.LAST_RECEIVED_SERVER_MESSAGE_ID="last_received_server_message_id";
    THREAD_PROPERTIES.LAST_RECEIVED_TIMESTAMP = "last_received_timestamp";
    THREAD_PROPERTIES.UNREAD_COUNT="unread_count";


    function incrementUnreadCountForThread(thread_id, callback) {
        CWMongoClient.getConnection(function (err, db) {
            if (err) {
                callback(err, null);
            } else {
                var collection = db.collection('thread');
                var query = {};
                query[THREAD_PROPERTIES.THREAD_ID] = thread_id;
                collection.findAndModify(
                    query,
                    {"$inc":{THREAD_PROPERTIES.UNREAD_COUNT:1}},
                    {"multi":true, upsert:true},
                    function(err, doc) {
                        callback(null, doc);
                    }
                );
            }
        });  
    }

    function decrementUnreadCountForThread(thread_id, owner_id, callback) {
        CWMongoClient.getConnection(function (err, db) {
            if (err) {
                callback(err, null);
            } else {
                var collection = db.collection('thread');
                var query = {};
                query[THREAD_PROPERTIES.THREAD_ID] = thread_id;
                collection.findAndModify(
                    query,
                    {"$inc":{THREAD_PROPERTIES.UNREAD_COUNT:-1}},
                    {"multi":true, upsert:true},
                    function(err, doc) {
                        callback(null, doc);
                    }
                );
            }
        });  
    }

    //creates a new thread
    function setLastMessageForThread(messagesDocuments, waterfallCallback) {
        var senderDocument = messagesDocuments[0];
        var recipientDocument = messagesDocuments[1];
        var threadObjects = [];
        createThreadForUser(senderDocument, function(sErr, senderThread){
            if(sErr){
                waterfallCallback(sErr,null);
            }
            else{
                threadObjects.push(senderThread);
                createThreadForUser(recipientDocument, function(rErr, recipientThread)){
                    if(rErr){
                        waterfallCallback(rErr, null);
                    }
                    else{
                        threadObjects.push(recipientThread);
                        waterfallCallback(err, threadObjects);
                    }
                });
            }
        });
    } 

    //creates a new thread
    function createThreadForUser(userDocument, callback) {

        //findAndModify
        //upsert
        CWMongoClient.getConnection(function (err, db) {
            if (err) {
                callback(err, null);
            } else {
                var collection = db.collection('threads');
                var query = {};
                query[THREAD_PROPERTIES.THREAD_INSTANCE_ID] = userDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OWNER_USER_ID] + "." + userDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.THREAD_ID];

                var threadObject = {}
                threadObject[THREAD_PROPERTIES.THREAD_ID] = userDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.THREAD_ID];
                threadObject[THREAD_PROPERTIES.OWNER_ID] = userDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OWNER_USER_ID];
                threadObject[THREAD_PROPERTIES.THREAD_INSTANCE_ID] = userDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OWNER_USER_ID] + "." + userDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.THREAD_ID];
                threadObject[THREAD_PROPERTIES.OTHER_USER_ID] = userDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OTHER_USER_ID];
                threadObject[THREAD_PROPERTIES.OWNER_THREAD_ROLE] = userDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OWNER_THREAD_ROLE];
                threadObject[THREAD_PROPERTIES.UNREAD_COUNT] = 1;
                if(userDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OWNER_ROLE] === ChatwalaMessageDocuments.ROLE_RECIPIENT){
                    threadObject[THREAD_PROPERTIES.LAST_RECEIVED_SERVER_MESSAGE_ID] = senderDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.SERVER_MESSAGE_ID];
                    threadObject[THREAD_PROPERTIES.LAST_RECEIVED_TIMESTAMP] = senderDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.TIMESTAMP];
                }
                console.log("Thread object for : " + userDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OWNER_ROLE]);
                callback(null, threadObject)
                /*collection.findAndModify(
                    query,
                    [['_id','asc']],
                    {"$set": threadObject},
                    {"multi":true, upsert:true},
                    function(err, doc) {
                        callback(null, doc);
                    }
                );*/
            }
        });
    }

    return {
        "setLastMessageForThread": setLastMessageForThread
    }
}());

module.exports = ThreadHelper;