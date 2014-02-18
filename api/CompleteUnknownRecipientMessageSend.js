var async = require('async');
var CWMongoClient = require('../cw_mongo.js');

var CompleteUnknownRecipientMessageSend=(function() {

    var responseCodes = {
        "success": {
            "code":1,
            "message":"A document for {{message_id}} has been successfully updated."
        },
        "invalidServerMessageId": {
            "code":-1,
            "message":"You provided an invalid server_message_id"
        },
        "failureDBConnect": {
            "code":-100,
            "message":"Unable to connect to the db"
        },
        "failureDBSave": {
            "code":-101,
            "message": "Unable to save message document to db"
        }
    };


    var Request = function() {
        this.server_message_id = undefined;
    };

    var Response = function() {
        this.messageDocument=null;
        this.responseCode=null;
    };

    /*
    Set uploaded to true on the original document
     */
    var execute = function(request, callback) {
        if(request.server_message_id === undefined) {
            var response = new Response();
            response.messageDocument = {};
            response.responseCode = responseCodes["invalidServerMessageId"];
            callback("invalidServerMessageId", response);
            return;
        }

        CWMongoClient.getConnection(function (err, db) {
            if (err) {
                var res = new Response();
                res.responseCode = responseCodes["failureDBConnect"];
                return callback("failureDBConnect", res);
            } else {
                var collection = db.collection('messages');

                collection.update(
                    {"server_message_id": request.server_message_id},
                    {"$set":{"uploaded":true}},
                    function (err, docs) {
                    if (!err) {
                        var response = new Response();
                        response.messageDocument = docs;
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

module.exports = CompleteUnknownRecipientMessageSend;


