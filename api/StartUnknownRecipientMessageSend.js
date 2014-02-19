var async = require('async');
var CWMongoClient = require('../cw_mongo.js');
var ChatwalaMessageDocuments = require("./ChatwalaMessageDocuments.js");

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
        this.client_message_id=undefined;
    };

    var Response = function() {
        this.message_meta_data=undefined;
        this.response_code=undefined;
    };

    var execute = function(request, callback) {

        var message = ChatwalaMessageDocuments.createNewStarterUnknownRecipientMessage(request.client_message_id, request.sender_id);
        if(message.isValid()) {
            CWMongoClient.getConnection(function (err, db) {
                if (err) {
                    var res = new Response();
                    res.responseCode = responseCodes["failureDBConnect"];
                    return callback("failureDBConnect", res);
                } else {
                    var collection = db.collection('messages');

                    collection.insert(message.properties,
                        function (err, doc) {
                            console.log("err=" + err);
                            if (!err) {
                                var response = new Response();
                                response.messageDocument = ChatwalaMessageDocuments.createMetaDataJSON(doc[0], false);
                                response.responseCode = responseCodes["success"];
                                callback(null, response);
                            } else {
                                var response = new Response();
                                response.messageDocument = {};
                                response.responseCode = responseCodes["failureDBSave"];
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


