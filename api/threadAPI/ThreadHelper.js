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



    function incrementUnreadCountForThread(thread_id, callback) {
        CWMongoClient.getConnection(function (err, db) {
            if (err) {
                callback(err, null);
            } else {
                var collection = db.collection('thread');
                var query = {};
                query[THREAD_PROPERTIES.THREAD_ID] = thread_id;
                var update = {};
                update[THREAD_PROPERTIES.UNREAD_COUNT] = 1;
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

    

    return {
        "THREAD_PROPERTIES" : THREAD_PROPERTIES,
        "THREAD_ROLE_STARTER" : THREAD_ROLE_STARTER,
        "THREAD_ROLE_REPLIER" : THREAD_ROLE_REPLIER
 
    }
}());

module.exports = ThreadHelper;