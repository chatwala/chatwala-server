var async = require('async');
var CWMongoClient = require('../cw_mongo.js');
var ChatwalaMessageDocuments = require("./ChatwalaMessageDocuments.js");

var ConvertUnknownRecipientMessageToKnownRecipient=(function() {

    var responseCodes = {
        "success": {
            "code":1,
            "message":"The recipient has been added"
        },
        "failure": {
          "code": -102,
           "message": "Something went wrong, was unable to convert to a known recipient message. Try again"
        },
        "failureInvalidMessageDocument":{
            "code":-10,
            "message":"invalid message document"
        },
        "failureDBConnect": {
            "code":-100,
            "message":"Unable to connect to the db"
        },
        "failureDBSave": {
            "code": -101,
            "message": "Unable to save message document to db"
        }
    };


    var Request = function() {
        this.server_message_id = undefined;
    };

    var Response = function() {
        this.responseCode=undefined;

        this.generateResponseDocument = function() {
            var responseDocument = {};
            responseDocument["response_code"] = this.responseCode;
            return responseDocument;
        }

    };

    function saveSenderDocument(originalDocument, request, parallelCallback) {
        console.log("originalDocument=");
        console.log(originalDocument);
        var message = new ChatwalaMessageDocuments.Message();
        message.setPropsFromDictionary(originalDocument);
        message.properties.owner_user_id = originalDocument.sender_id;
        message.properties.owner_role = ChatwalaMessageDocuments.ROLE_SENDER;
        message.properties.other_user_id = request.recipient_id;
        message.properties.other_user_role = ChatwalaMessageDocuments.ROLE_RECIPIENT;
        message.properties.recipient_id = request.recipient_id;
        message.properties.unknown_recipient_starter=false;
        message.properties.showable=true;
        message.generateMessageInstanceId();
        message.generateThreadInformation();
        console.log("message.properties=");
        console.log(message.properties);
        if(message.isValid()) {
            console.log("message is valid");

            CWMongoClient.getConnection(function (err, db) {
                console.log("got connection");
                if (err) {
                    console.log("we have an error!");
                    var res = new Response();
                    res.responseCode = responseCodes["failureDBConnect"];
                    return parallelCallback("failureDBConnect", res);
                } else {
                    console.log("getting the collection");
                    var collection = db.collection('messages');

                    collection.insert(message.properties,
                        function (err, docs) {
                            console.log(err);
                            if (!err) {
                                var response = new Response();
                                response.messageDocument = docs;
                                response.responseCode = responseCodes["success"];
                                parallelCallback(null, response);
                            } else {
                                var response = new Response();
                                response.messageDocument = {};
                                response.responseCode = responseCodes["failureDBSave"];
                                parallelCallback("failureDBSave", response);
                            }
                        });
                }
            });
        }
        else {
            console.log("MESSAGE IS NOT VALID");
            var response = new Response();
            response.messageDocument = {};
            response.responseCode = responseCodes["failureInvalidMessageDocument"];
            parallelCallback("failureInvalidMessageDocument", response);
        }
    }


    function saveRecipientDocument(originalDocument, request, parallelCallback) {
        var message = new ChatwalaMessageDocuments.Message();
        message.setPropsFromDictionary(originalDocument);
        message.properties.owner_user_id = request.recipient_id;
        message.properties.owner_role = ChatwalaMessageDocuments.ROLE_RECIPIENT;
        message.properties.other_user_id = originalDocument.sender_id;
        message.properties.other_user_role = ChatwalaMessageDocuments.ROLE_SENDER;
        message.properties.recipient_id = request.recipient_id;
        message.properties.unknown_recipient_starter=false;
        message.properties.showable=true;
        message.generateMessageInstanceId();
        message.generateThreadInformation();
        console.log("message.properties=");
        console.log(message.properties);
        if(message.isValid()) {
            console.log("message is valid");
            CWMongoClient.getConnection(function (err, db) {
                console.log("get connection");
                if (err) {
                    var res = new Response();
                    res.responseCode = responseCodes["failureDBConnect"];
                    return parallelCallback("failureDBConnect", res);
                } else {
                    var collection = db.collection('messages');

                    collection.insert(message.properties,
                        function (err, docs) {
                            if (!err) {
                                var response = new Response();
                                response.messageDocument = docs;
                                response.responseCode = responseCodes["success"];
                                parallelCallback(null, response);
                            } else {
                                var response = new Response();
                                response.messageDocument = {};
                                response.responseCode = responseCodes["failureDBSave"];
                                parallelCallback("failureDBSave", response);
                            }
                        });
                }
            });
        }
        else {
            console.log("MESSAGE IS NOT VALID");
            var response = new Response();
            response.messageDocument = {};
            response.responseCode = responseCodes["failureInvalidMessageDocument"];
            parallelCallback("failureInvalidMessageDocument", response);
        }
    }

    function getOriginalDocument(request, waterfallCallback) {
        CWMongoClient.getConnection(function (err, db) {
            if (err) {
                waterfallCallback(err, null);
            } else {
                var collection = db.collection('messages');
                collection.findOne({"server_message_id": request.server_message_id}, function (err, messageDocument) {
                    waterfallCallback(err, messageDocument);
                });
            }
        });
    }

    var execute = function(request, callback) {
        async.waterfall(
            [
                function(waterfallCallback) {
                    getOriginalDocument(request, waterfallCallback);
                },
                function(originalDocument, waterfallCallback) {
                    async.parallel([
                        function(parallelCallback) {
                            saveSenderDocument(originalDocument, request, parallelCallback);
                        },
                        function(parallelCallback) {
                            saveRecipientDocument(originalDocument, request, parallelCallback);
                        }
                    ],
                        function(err, results) {
                            waterfallCallback(err, results);
                        }
                    );
                }
            ],
            function(err, responseArray) {
                var success = true;
                for(var i=0; i<responseArray.length; i++) {
                    if(responseArray[i].responseCode.code!=1) {
                        success=false;
                    }
                }

                var response = new Response();
                if(success) {
                    response.responseCode = responseCodes["success"];
                }
                else {
                    response.responseCode = responseCodes["failure"];
                }
                console.log(response);
                callback(err, response);
            }
        );

    }


    return {
        "responseCodes": responseCodes,
        "Request": Request,
        "execute": execute
    };
}());

module.exports = ConvertUnknownRecipientMessageToKnownRecipient;


