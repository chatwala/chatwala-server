/**
 * Created by samirahman on 2/24/14.
 */

var config = require('../../config.js');
var azure = require('azure');
var ChatwalaMessageDocuments = require("../messagesAPI/ChatwalaMessageDocuments.js");
var CWMongoClient = require('../../cw_mongo.js');


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

    var responseCodes = {
        "success": {
            "code":1,
            "message":"The recipient has been added"
        },
        "failure": {
          "code": -100,
           "message": "Something went wrong, was unable to convert to a known recipient message. Try again"
        },
        "failureInvalidMessageDocument":{
            "code":-101,
            "message":"invalid message document"
        },
        "failureDBConnect": {
            "code":-200,
            "message":"Unable to connect to the db"
        },
        "failureDBSave": {
            "code": -201,
            "message": "Unable to save message document to db"
        }
    };


/*
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
                var update = {};
                update[THREAD_PROPERTIES.UNREAD_COUNT] = -1;
                collection.findAndModify(
                    query,
                    {"$inc":update},
                    {"multi":true, upsert:true},
                    function(err, doc) {
                        callback(null, doc);
                    }
                );
            }
        });  
    }
*/
    //creates a new thread
    function setLastMessageForThread(messagesDocuments, waterfallCallback) {
        var senderDocument = messagesDocuments[0];
        var recipientDocument = messagesDocuments[1];
        createThreadForUser(senderDocument, function(sErr, senderThread){
            if(sErr){
                var response = new Response();
                response.response_code = responseCodes["failureDBSave"];
                waterfallCallback("failureDBSave", response);
            }
            else{
                createThreadForUser(recipientDocument, function(rErr, recipientThread){
                    if(rErr){
                        var response = {};
                        response.response_code = responseCodes["failureDBSave"];
                        waterfallCallback("failureDBSave", response);
                    }
                    else{
                        var response = {};
                        response.response_code = responseCodes["success"];
                        waterfallCallback(null, response);
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
                threadObject[THREAD_PROPERTIES.OWNER_THREAD_ROLE] = userDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OWNER_ROLE];
                threadObject[THREAD_PROPERTIES.UNREAD_COUNT] = 0;                
                if(userDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OWNER_ROLE] === ChatwalaMessageDocuments.ROLE_RECIPIENT){
                    threadObject[THREAD_PROPERTIES.LAST_RECEIVED_SERVER_MESSAGE_ID] = userDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.SERVER_MESSAGE_ID];
                    threadObject[THREAD_PROPERTIES.LAST_RECEIVED_TIMESTAMP] = userDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.TIMESTAMP];
                    threadObject[THREAD_PROPERTIES.UNREAD_COUNT] = 1;
                }

                collection.findAndModify(
                    query,
                    [['_id','asc']],
                    {"$set": threadObject},
                    {"multi":true, upsert:true},
                    function(err, doc) {
                        if (!err) {
                            callback(null, doc);
                        } else {
                            callback(err, null);
                        }
                    }
                );
            }
        });
    }

    return {
        "setLastMessageForThread": setLastMessageForThread
    }
}());

module.exports = ThreadHelper;