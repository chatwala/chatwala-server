var async = require('async');
var CWMongoClient = require('../cw_mongo.js');
var ChatwalaMessageDocuments = require("./ChatwalaMessageDocuments.js");

var StartUnknownRecipientMessageSend=(function() {

    var responseCodes = {
        "success": {
            "code":1,
            "message":"A document for {{message_id}} has been successfully added to the messages collection."
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
        this.sender_id=null;
        this.message_id=null;
    };

    var Response = function() {
        this.messageDocument=null;
        this.responseCode=null;
    };

    var execute = function(request, callback) {

        CWMongoClient.getConnection(function (err, db) {
            if (err) {
                var res = new Response();
                res.responseCode = responseCodes["failureDBConnect"];
                return callback("failureDBConnect", res);
            } else {
                var collection = db.collection('messages');
                var messageDocument = ChatwalaMessageDocuments.createStarterUnknownRecipientMessageDocument(request);
                collection.insert(messageDocument,
                    function (err, docs) {
                    if (!err) {
                        var response = new Response();
                        response.messageDocument = messageDocument;
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
    };

    return {
        "responseCodes": responseCodes,
        "Request": Request,
        "execute": execute
    };
}());

exports = StartUnknownRecipientMessageSend;


