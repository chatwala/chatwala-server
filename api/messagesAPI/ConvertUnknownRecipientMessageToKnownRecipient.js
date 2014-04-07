var async = require('async');
var CWMongoClient = require('../../cw_mongo.js');
var ChatwalaMessageDocuments = require("./ChatwalaMessageDocuments.js");
var ThreadApi = require("../threadAPI/ThreadApi.js");
var UserApi = require("../userAPI/UserApi.js");

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
        this.message_id = undefined;
        this.client_version_id=undefined;
        this.analytics_recipient_category=null;
    };

    var Response = function() {
        this.response_code=undefined;
    };

    function saveSenderDocument(originalDocument, request, parallelCallback) {

        var message = new ChatwalaMessageDocuments.Message();
        message.setPropsFromDictionary(originalDocument);
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.VERSION] = originalDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.VERSION];
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OWNER_USER_ID] = originalDocument.sender_id;
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OWNER_ROLE] = ChatwalaMessageDocuments.ROLE_SENDER;
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OTHER_USER_ID] = request.recipient_id;
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OTHER_USER_ROLE] = ChatwalaMessageDocuments.ROLE_RECIPIENT;
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.RECIPIENT_ID] = request.recipient_id;
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.UNKNOWN_RECIPIENT_STARTER]=false;
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.THREAD_STARTER]=true;
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.DELETED]=false;
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.SHOWABLE]=true;
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.ANALYTICS_SENDER_CATEGORY]= originalDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.ANALYTICS_SENDER_CATEGORY];
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.ANALYTICS_RECIPIENT_CATEGORY]= request.analytics_recipient_category;
        message.generateMessageInstanceId();
        message.generateThreadInformation();

        if(message.isValid()) {


            CWMongoClient.getConnection(function (err, db) {

                if (err) {
                    console.log("error on save sender document");
                    console.log(err);
                    var res = new Response();
                    res.response_code = responseCodes["failureDBConnect"];
                    return parallelCallback("failureDBConnect", res);
                } else {

                    var collection = db.collection('messages');

                    var query={};
                    query[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.MESSAGE_INSTANCE_ID]=message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.MESSAGE_INSTANCE_ID];
                    /*query[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.UNKNOWN_RECIPIENT_STARTER]=false;
                    query[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OWNER_USER_ID]=request.sender_id;
                    query[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.message_id]=message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.message_id];
                    */

                    message.properties["last_modified"] = new Date().getTime();

                    collection.findAndModify(
                        query,
                        [['_id','asc']],
                        message.properties,
                        {"upsert":true, "multi":false, "new":true},
                        function (err, updated) {
                            var response = new Response();
                            if (!err) {
                                response.response_code = responseCodes["success"];
                                parallelCallback(null, response, updated);
                            } else {
                                console.log(err);
                                response.response_code = responseCodes["failureDBSave"];
                                parallelCallback("failureDBSave", response, updated);
                            }
                        });
                }
            });
        }
        else {
            console.log("Error message not valid in save sender document");
            var response = new Response();
            response.messageDocument = {};
            response.response_code = responseCodes["failureInvalidMessageDocument"];
            parallelCallback("failureInvalidMessageDocument", response, null);
        }
    }


    function saveRecipientDocument(originalDocument, request, parallelCallback) {
        var message = new ChatwalaMessageDocuments.Message();
        message.setPropsFromDictionary(originalDocument);
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.VERSION] = originalDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.VERSION];
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OWNER_USER_ID] = request.recipient_id;
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OWNER_ROLE] = ChatwalaMessageDocuments.ROLE_RECIPIENT;
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OTHER_USER_ID] = originalDocument.sender_id;
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OTHER_USER_ROLE] = ChatwalaMessageDocuments.ROLE_SENDER;
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.RECIPIENT_ID] = request.recipient_id;
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.UNKNOWN_RECIPIENT_STARTER]=false;
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.THREAD_STARTER]=true;
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.DELETED]=false;
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.SHOWABLE]=true;
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.ANALYTICS_RECIPIENT_CATEGORY] = request.analytics_recipient_category;
        message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.ANALYTICS_SENDER_CATEGORY] = originalDocument.analytics_sender_category;

        message.generateMessageInstanceId();
        message.generateThreadInformation();

        if(message.isValid()) {

            CWMongoClient.getConnection(function (err, db) {

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
                    query[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.message_id]=message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.message_id];
                    */

                    message.properties["last_modified"] = new Date().getTime();

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
            console.log("Error message is not valid in save recipient document");
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
                var query = {};
                query[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.MESSAGE_ID]=request.message_id;
                collection.findOne(query, function (err, messageDocument) {
                    if(messageDocument==null) {
                        waterfallCallback("messageIsNull", null);
                    }
                    else {
                        waterfallCallback(null, messageDocument);
                    }

                });
            }
        });
    }

    var execute = function(request, callback) {

        if(!request.analytics_recipient_category) {
            request.analytics_recipient_category=null;
        }
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
                                //var senderDocument = results[0][1];
                                //var recipientDocument = results[1][1];
                                waterfallCallback(null, null)
                                //waterfallCallback(null, [senderDocument, recipientDocument])
                            }
                        }
                    );

                }/*,
                function(messageDocuments, waterfallCallback){
                    ThreadApi.CreateThreadsFromMessageDocuments.execute(messageDocuments, waterfallCallback);
                },
                function(messageDocuments, waterfallCallback){
                    UserApi.CreateInitialUser.execute(messageDocuments, waterfallCallback);
                }*/
            ],
            function(err, results) {


                var response = new Response();
                if(!err) {
                    response.response_code = responseCodes["success"];
                }
                else {
                    console.log("Error in convert unknown recipient message to known recipient");
                    console.log(err);
                    response.response_code = responseCodes["failure"];
                }

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


