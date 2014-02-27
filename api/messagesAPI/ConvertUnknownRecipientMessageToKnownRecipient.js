var async = require('async');
var CWMongoClient = require('../../cw_mongo.js');
var ChatwalaMessageDocuments = require("./ChatwalaMessageDocuments.js");
var Threads = require("../threadAPI/ThreadAPI.js");

var ConvertUnknownRecipientMessageToKnownRecipient=(function() {

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


    var Request = function() {
        this.server_message_id = undefined;
    };

    var Response = function() {
        this.response_code=undefined;
    };

    function saveSenderDocument(originalDocument, request, parallelCallback) {
        console.log("originalDocument=");
        console.log(originalDocument);
        var message = new ChatwalaMessageDocuments.Message();
        message.setPropsFromDictionary(originalDocument);
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OWNER_USER_ID] = originalDocument.sender_id;
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OWNER_ROLE] = ChatwalaMessageDocuments.ROLE_SENDER;
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OTHER_USER_ID] = request.recipient_id;
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OTHER_USER_ROLE] = ChatwalaMessageDocuments.ROLE_RECIPIENT;
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.RECIPIENT_ID] = request.recipient_id;
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.UNKNOWN_RECIPIENT_STARTER]=false;
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.THREAD_STARTER]=true;
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.SHOWABLE]=true;
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
                    res.response_code = responseCodes["failureDBConnect"];
                    return parallelCallback("failureDBConnect", res);
                } else {
                    console.log("getting the collection");
                    var collection = db.collection('messages');

                    var query={};
                    query[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.MESSAGE_INSTANCE_ID]=message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.MESSAGE_INSTANCE_ID];
                    /*query[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.UNKNOWN_RECIPIENT_STARTER]=false;
                    query[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OWNER_USER_ID]=request.sender_id;
                    query[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.SERVER_MESSAGE_ID]=message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.SERVER_MESSAGE_ID];
                    */
                    collection.findAndModify(
                        query,
                        [['_id','asc']],
                        message.properties,
                        {"upsert":true, "multi":false, "new":true},
                        function (err, updated) {
                            console.log(err);
                            if (!err) {
                                var response = new Response();
                                response.response_code = responseCodes["success"];
                                parallelCallback(null, response, updated);
                            } else {
                                var response = new Response();
                                response.response_code = responseCodes["failureDBSave"];
                                parallelCallback("failureDBSave", response, updated);
                            }
                        });
                }
            });
        }
        else {
            console.log("MESSAGE IS NOT VALID");
            var response = new Response();
            response.messageDocument = {};
            response.response_code = responseCodes["failureInvalidMessageDocument"];
            parallelCallback("failureInvalidMessageDocument", response, null);
        }
    }


    function saveRecipientDocument(originalDocument, request, parallelCallback) {
        var message = new ChatwalaMessageDocuments.Message();
        message.setPropsFromDictionary(originalDocument);

        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OWNER_USER_ID] = request.recipient_id;
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OWNER_ROLE] = ChatwalaMessageDocuments.ROLE_RECIPIENT;
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OTHER_USER_ID] = originalDocument.sender_id;
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OTHER_USER_ROLE] = ChatwalaMessageDocuments.ROLE_SENDER;
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.RECIPIENT_ID] = request.recipient_id;
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.UNKNOWN_RECIPIENT_STARTER]=false;
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.THREAD_STARTER]=true;
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.SHOWABLE]=true;

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

                    var query = {};
                    query[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.MESSAGE_INSTANCE_ID]=message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.MESSAGE_INSTANCE_ID];
                    /*query[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.UNKNOWN_RECIPIENT_STARTER]=false;
                    query[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OWNER_USER_ID]=request.recipient_id;
                    query[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.SERVER_MESSAGE_ID]=message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.SERVER_MESSAGE_ID];
                    */
                    collection.findAndModify(
                        query,
                        [['_id','asc']],
                        message.properties,
                        {"upsert":true, "multi":false, "new":true},
                        function (err, updated) {
                            if (!err) {
                                var response = new Response();
                                response.response_code = responseCodes["success"];
                                parallelCallback(null, response, updated);
                            } else {
                                var response = new Response();
                                response.response_code = responseCodes["failureDBSave"];
                                parallelCallback("failureDBSave", response, null);
                            }
                        });
                }
            });
        }
        else {
            console.log("MESSAGE IS NOT VALID");
            var response = new Response();
            response.response_code = responseCodes["failureInvalidMessageDocument"];
            parallelCallback("failureInvalidMessageDocument", response, null);
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
                            if(err){
                                console.log("error on message creation, cannot create thread");
                                waterfallCallback(err, null);
                            }
                            else{
                                //get info from results
                                var senderDocument = results[0][1];
                                var recipientDocument = results[1][1];
                                waterfallCallback(null, [senderDocument, recipientDocument])
                            }
                        }
                    );
                },
                function(messageDocuments, waterfallCallback){
                    Threads.setLastMessageForThread(messageDocuments, waterfallCallback);
                }
            ],
            function(err, responseArray) {
                var success = true;
                for(var i=0; i<responseArray.length; i++) {
                    if(responseArray[i].response_code.code!=1) {
                        success=false;
                    }
                }

                var response = new Response();
                if(success) {
                    response.response_code = responseCodes["success"];
                }
                else {
                    response.response_code = responseCodes["failure"];
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


