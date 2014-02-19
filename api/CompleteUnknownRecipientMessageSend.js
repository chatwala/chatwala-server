var async = require('async');
var CWMongoClient = require('../cw_mongo.js');
var ChatwalaMessageDocuments = require("./ChatwalaMessageDocuments.js");

var CompleteUnknownRecipientMessageSend=(function() {

    var responseCodes = {
        "success": {
            "code":1,
            "message":"The message has been successfully marked as uploaded."
        },
        "failureInvalidServerMessageId": {
            "code":-101,
            "message":"You provided an invalid server_message_id"
        },
        "failureDBConnect": {
            "code":-200,
            "message":"Unable to connect to the db"
        },
        "failureDBSave": {
            "code":-201,
            "message": "Unable to save message document to db"
        }
    };


    var Request = function() {
        this.server_message_id = undefined;
    };

    var Response = function() {
        this.message_meta_data=undefined;
        this.response_code=undefined;
    };

    /*
    Set uploaded to true on the original document
     */
    var execute = function(request, callback) {
        if(request.server_message_id === undefined) {
            var response = new Response();
            response.message_meta_data = {};
            response.response_code = responseCodes["failureInvalidServerMessageId"];
            callback("failureInvalidServerMessageId", response);
            return;
        }

        CWMongoClient.getConnection(function (err, db) {
            if (err) {
                var res = new Response();
                res.response_code = responseCodes["failureDBConnect"];
                return callback("failureDBConnect", res);
            } else {
                var collection = db.collection('messages');

                collection.update(
                    {"server_message_id": request.server_message_id},
                    {"$set":{"uploaded":true}},
                    function (err, docs) {
                    if (!err) {
                        var response = new Response();
                        response.message_meta_data = ChatwalaMessageDocuments.createMetaDataJSON(docs);
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
    };

    return {
        "responseCodes": responseCodes,
        "Request": Request,
        "execute": execute
    };
}());

module.exports = CompleteUnknownRecipientMessageSend;


