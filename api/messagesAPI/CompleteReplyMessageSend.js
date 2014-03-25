var async = require('async');
var CWMongoClient = require('./../../cw_mongo.js');
var ChatwalaMessageDocuments = require("./ChatwalaMessageDocuments.js");
var PushHelper = require("./../PushHelper.js");
var ThreadHelper = require("./../threadAPI/ThreadHelper");

var CompleteReplyMessageSend=(function() {

    var responseCodes = {
        "success": {
            "code":1,
            "message":"The message has been successfully marked as uploaded."
        },
        "failureDBSave": {
            "code":-201,
            "message": "Unable to save message document to db"
        },
        "failureInvalidServerMessageId": {
            "code":-101,
            "message":"You provided an invalid message_id"
        }
    };


    var Request = function() {
        this.message_id = undefined;
    };

    var Response = function() {
        this.response_code=undefined;
    };

    /*
    Set uploaded to true on the original document
     */
    var execute = function(request, callback) {

        if(request.message_id === undefined) {
            var response = new Response();
            response.message_meta_data = {};
            response.response_code = responseCodes["failureInvalidServerMessageId"];
            callback("failureInvalidServerMessageId", response);
            return;
        }

        async.waterfall([
            //update to say "uploaded"

            function(seriesCallback) {
                CWMongoClient.getConnection(function (err, db) {
                    if (err) {
                        seriesCallback(err, null);
                    } else {
                        var collection = db.collection('messages');
                        var query = {};
                        query[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.MESSAGE_ID] = request.message_id;

                        var update = {}
                        update["uploaded"] = true;
                        update["showable"] = true;
                        var current_time = new Date().getTIme();
                        update["uploaded_time"] = current_time;
                        update["last_modified"] = current_time;

                        collection.update(
                            query,
                            {"$set":update},
                            {"multi":true, "new":true},
                            function(err, numberTouched) {
                                seriesCallback(numberTouched==0?"failure":null, true);
                                getRecipientIDAndSendPushNotification(request.message_id);
                                //ThreadHelper.incrementUnreadCountForThread()
                            }
                        );
                    }
                });
            }

        ],

        function(err, results) {
            var response = new Response();
            if(err) {
                response.response_code = responseCodes["failureDBSave"];
                callback(err, response);
            }
            else {
                response.response_code = responseCodes["success"];
                callback(null, response);
            }
        }
        );
    };


    //get the recipient id and send the push notification
    function getRecipientIDAndSendPushNotification(message_id){
        //get recipient_id
        CWMongoClient.getConnection(function (err, db) {
            if (err) {
                seriesCallback(err, null);
            } else {
                var collection = db.collection('messages');
                var query = {};
                query[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.MESSAGE_ID] = message_id;
                collection.find(
                    query,
                    function(err, cursor) {
                        if(!err) {
                            cursor.nextObject(function(err, document) {
                                sendPushNotification(document);
                            });
                        }
                        else{
                            console.log("Cannot find user to send push notification to");
                        }
                    }
                );
            }
        });

    }

    //send push notification
    function sendPushNotification(messageDocument){

        var recipientId = messageDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.RECIPIENT_ID];
        PushHelper.sendPush(recipientId, function(err, results){
            //we don't really care if the push failed
            if(err){
                console.log("Push notification failed to send for " + messageDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.RECIPIENT_ID])
            }
        });
    }

    return {
        "responseCodes": responseCodes,
        "Request": Request,
        "execute": execute
    };
}());

module.exports = CompleteReplyMessageSend;


