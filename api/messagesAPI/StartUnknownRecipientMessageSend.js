var async = require('async');
var CWMongoClient = require('../../cw_mongo.js');
var ChatwalaMessageDocuments = require("./ChatwalaMessageDocuments.js");
var SASHelper = require('../SASHelper.js');

var StartUnknownRecipientMessageSend=(function() {

    var responseCodes = {
        "success": {
            "code":1,
            "message":"The message has been successfully added to the users outbox."
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

    var Request = function() {
        this.sender_id=undefined;
        this.message_id=undefined;
    };

    var Response = function() {
        this.message_meta_data=undefined;
        this.write_url=undefined;
        this.response_code=undefined;
    };

    var execute = function(request, callback) {

        var message = ChatwalaMessageDocuments.createNewStarterUnknownRecipientMessage(request.message_id, request.sender_id);
        if(message.isValid()) {
            CWMongoClient.getConnection(function (err, db) {
                if (err) {
                    var res = new Response();
                    res.responseCode = responseCodes["failureDBConnect"];
                    return callback("failureDBConnect", res);
                } else {
                    var collection = db.collection('messages');

                    message.properties["last_modified"] = new Date().getTime();

                    collection.insert(message.properties,
                        function (err, doc) {
                            console.log("err=" + err);
                            if (!err) {
                                var response = new Response();
                                response.message_meta_data = ChatwalaMessageDocuments.createMetaDataJSON(doc[0], false);
                                response.write_url = SASHelper.getWriteSharedAccessPolicy(
                                    message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.BLOB_STORAGE_SHARD_KEY],
                                    message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.MESSAGE_ID]);
                                response.response_code = responseCodes["success"];
                                callback(null, response);
                            } else {
                                var response = new Response();
                                response.message_meta_data = {};
                                response.response_code = responseCodes["failureDBSave"];
                                callback("failureDBSave", response);
                            }
                        });
                }
            });
        }

    };

    return {
        "responseCodes": responseCodes,
        "Request": Request,
        "execute": execute
    };
}());

module.exports = StartUnknownRecipientMessageSend;


