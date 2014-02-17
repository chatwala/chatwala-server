var async = require('async');
var CWMongoClient = require('../cw_mongo.js');

var CompleteUnknownRecipientMessageSend=(function() {

    var responseCodes = {
        "success": {
            "code":1,
            "message":"The document for {{message_id}} has been successfully updated."
        },
        "failureDBConnect": {
            "code":2,
            "message":"Unable to connect to the db"
        },
        "failureDBSave": {
            "code": 3,
            "message": "Unable to save message document to db"
        }
    };


    var Request = function() {
        this.message_instance_id = null;
    };

    var Response = function() {
        this.messageDocument=null;
        this.responseCode=null;
    };

    var createSenderMessageDocument= function(request, originalTimestamp) {
        return {
            "message_instance_id": request.sender_id + "." + request.message_id,
            "message_id": request.message_id,
            "owner_user_id": request.sender_id,
            "owner_role": "sender",
            "other_user_id": request.recipient_id,
            "other_role": "recipient",
            "sender_id":request.sender_id,
            "recipient_id": request.recipient_id,
            "thread_id": request.message_id + "." + request.sender_id + "." + request.recipient_id,
            "thread_count":0,
            "replying_to_message_id": null,
            "blob_storage_shard_key":1,
            "unknown_recipient_starter": false,
            "uploaded":true,
            "received":true,
            "replied": false,
            "replied_message_id":null,
            "showable":true,
            "timestamp":originalTimestamp
        };
    };

    var createRecipientMessageDocument = function(request, originalTimestamp) {
        return {
            "message_instance_id": request.recipient_id + "." + request.message_id,
            "message_id": request.message_id,
            "owner_user_id": request.recipient_id,
            "owner_role": "recipient",
            "other_user_id": request.sender_id,
            "other_role": "sender",
            "sender_id":request.sender_id,
            "recipient_id":request.recipient_id,
            "thread_id": request.message_id + "." + request.sender_id + "." + request.recipient_id,
            "thread_count":0,
            "replying_to_message_id": null,
            "blob_storage_shard_key":1,
            "unknown_recipient_starter": false,
            "uploaded":true,
            "received":true,
            "replied": false,
            "replied_message_id":null,
            "showable":true,
            "timestamp":originalTimestamp
        };
    }

    var createActionSaveSenderMessageDocument = function(request) {
        return function(callback) {

            //get db connection

            CWMongoClient.getConnection(function (err, db) {
                if (err) {
                    callback("failureDBConnect");
                } else {
                    //save sender document
                    var collection = db.collection('messages');
                    collection.insert();
                    callback(null,"success");
                }
            });


        };
    };
    var createActionReceiverMessageDocument = function(request) {
        return function(callback) {

            //get db connection

            //save receiver document
            callback(null,"success");
        }
    };


    var execute = function(request, callback) {

        async.series([
            createActionSaveSenderMessageDocument(request),
            createActionReceiverMessageDocument(request),
        ],
        function(err, results) {

        }
        );

    };

    return {
        "responseCodes": responseCodes,
        "Request": Request,
        "execute": execute
    };
}());

exports = CompleteUnknownRecipientMessageSend;


