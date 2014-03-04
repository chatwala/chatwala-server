/****
	created by kevin miller on 2/27/14
****/

var config = require('../../config.js');
var azure = require('azure');
var CWMongoClient = require('../../cw_mongo.js');

var ThreadHelper = require('./ThreadHelper.js');
var ChatwalaMessageDocuments = require("../messagesAPI/ChatwalaMessageDocuments.js");



var CreateThreadsFromMessageDocuments = (function(){

	 var responseCodes = {
        "success": {
            "code":1,
            "message":"The thread has been created"
        },
        "failure": {
          "code": -100,
           "message": "Something went wrong, was unable to create a thread for a message. Try again"
        },
        "failureInvalidMessageDocument":{
            "code":-101,
            "message":"invalid message document"
        },
        "failureInvalidThreadDocument":{
            "code":-101,
            "message":"invalid message document"
        },
        "failureDBConnect": {
            "code":-200,
            "message":"Unable to connect to the db"
        },
        "failureDBSave": {
            "code": -201,
            "message": "Unable to save thread document to db"
        }
    };


    var Request = function() {
        this.message_id = undefined;
    };

    var Response = function() {
        this.response_code=undefined;
    };


    //creates a new thread
    function execute(messagesDocuments, waterfallCallback) {
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
                        var response = new Response();
                        response.response_code = responseCodes["failureDBSave"];
                        waterfallCallback("failureDBSave", response);
                    }
                    else{
                        var response = new Response();
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
                query[ThreadHelper.THREAD_PROPERTIES.THREAD_INSTANCE_ID] = userDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OWNER_USER_ID] + "." + userDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.THREAD_ID];

                var threadObject = {}
                threadObject[ThreadHelper.THREAD_PROPERTIES.THREAD_ID] = userDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.THREAD_ID];
                threadObject[ThreadHelper.THREAD_PROPERTIES.OWNER_ID] = userDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OWNER_USER_ID];
                threadObject[ThreadHelper.THREAD_PROPERTIES.THREAD_INSTANCE_ID] = userDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OWNER_USER_ID] + "." + userDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.THREAD_ID];
                threadObject[ThreadHelper.THREAD_PROPERTIES.OTHER_USER_ID] = userDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OTHER_USER_ID];
                threadObject[ThreadHelper.THREAD_PROPERTIES.OWNER_THREAD_ROLE] = userDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OWNER_ROLE];
                threadObject[ThreadHelper.THREAD_PROPERTIES.UNREAD_COUNT] = 0;                
                if(userDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OWNER_ROLE] === ChatwalaMessageDocuments.ROLE_RECIPIENT){
                    threadObject[ThreadHelper.THREAD_PROPERTIES.LAST_RECEIVED_SERVER_MESSAGE_ID] = userDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.SERVER_MESSAGE_ID];
                    threadObject[ThreadHelper.THREAD_PROPERTIES.LAST_RECEIVED_TIMESTAMP] = userDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.TIMESTAMP];
                    threadObject[ThreadHelper.THREAD_PROPERTIES.UNREAD_COUNT] = 1;
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
        "responseCodes": responseCodes,
        "Request": Request,
        "execute": execute
    };


}());


module.exports = CreateThreadsFromMessageDocuments