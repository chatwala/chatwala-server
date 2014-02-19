var async = require('async');
var CWMongoClient = require('../cw_mongo.js');
var ChatwalaMessageDocuments = require("./ChatwalaMessageDocuments.js");

var StartKnownRecipientMessageSend=(function() {

    var responseCodes = {
        "success": {
            "code":1,
            "message":"The message has been successfully saved"
        },
        "failure": {
            "code":-100,
            "message":"A failure occurred while trying to save the message"
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
        this.owner_user_id=undefined;
        this.client_message_id=undefined;
        this.replying_to_server_message_id=undefined;
    };

    var Response = function() {
        this.message_meta_data=undefined;
        this.response_code=undefined;
    };

    var execute = function(request, callback) {
        async.waterfall([
            //1. get replying_to_message
            function(waterfallCallback) {
                CWMongoClient.getConnection(function (err, db) {
                    if (err) {
                        return waterfallCallback(err, null);
                    } else {
                        var collection = db.collection('messages');

                        collection.findOne({"owner_user_id":request.owner_user_id, "server_message_id": request.replying_to_server_message_id},
                            function (err, doc) {
                                console.log("err=" + err);
                                if (!err) {
                                    waterfallCallback(null, doc);
                                } else {
                                    waterfallCallback(err, null);
                                }
                            });
                    }
                })
            },

            //2. put the message in the senders outbox
            function(originalMessageDocument, waterfallCallback) {
                console.log("originalMessage=");
                console.log(originalMessageDocument);
                var message = new ChatwalaMessageDocuments.Message();
                message.setPropsFromDictionary(
                    {
                        "client_message_id": request.client_message_id,
                        //swap sender/receiver roles
                        "owner_user_id": request.owner_user_id,
                        "owner_role": ChatwalaMessageDocuments.ROLE_SENDER,
                        "other_user_role": ChatwalaMessageDocuments.ROLE_RECIPIENT,
                        "other_user_id":originalMessageDocument["sender_id"],
                        "sender_id": request.owner_user_id,
                        "recipient_id": originalMessageDocument["other_user_id"],
                        "thread_count": Number(originalMessageDocument["thread_count"])+1,
                        "thread_id": originalMessageDocument["thread_id"],
                        "group_id":originalMessageDocument["group_id"],
                        "replying_to_server_message_id":request.replying_to_server_message_id,
                        "unknown_recipient_starter":false,
                        "showable":true
                    }
                );

                message.generateBlobShardKey();
                message.generateServerMessageId();
                message.generateMessageInstanceId();

                //update time stamp
                message.generateTimeStamp();

                if(message.isValid()) {
                    console.log("trying to add to outbox");
                    CWMongoClient.getConnection(function (err, db) {
                        if (err) {
                            return waterfallCallback(err, null);
                        } else {
                            var collection = db.collection('messages');

                            //we do an update so retries can succeed
                            collection.update(
                                {"message_instance_id":message.properties["message_instance_id"]},
                                message.properties,
                                {"upsert":true, "multi": false},
                                function (err, updated) {
                                    if (!err) {
                                        waterfallCallback(null, message.properties);
                                    } else {
                                        waterfallCallback(err, null);
                                    }
                                });
                        }
                    })
                }
                else {
                    waterfallCallback("invalid message", null);
                }
            },

            //3. put message in the recipients inbox
            function(outboxMessageDocument, waterfallCallback) {
                var message = new ChatwalaMessageDocuments.Message();
                message.setPropsFromDictionary(
                    {
                        "client_message_id": request.client_message_id,
                        "owner_user_id": outboxMessageDocument["recipient_id"],
                        "owner_role": ChatwalaMessageDocuments.ROLE_RECIPIENT,
                        "other_user_role": ChatwalaMessageDocuments.ROLE_SENDER,
                        "other_user_id":outboxMessageDocument["sender_id"],
                        "sender_id": outboxMessageDocument["sender_id"],
                        "recipient_id": outboxMessageDocument["recipient_id"],
                        "thread_count": outboxMessageDocument["thread_count"],
                        "thread_id": outboxMessageDocument["thread_id"],
                        "group_id":outboxMessageDocument["group_id"],
                        "replying_to_server_message_id":outboxMessageDocument["replying_to_server_message_id"],
                        "unknown_recipient_starter":false,
                        "showable":false,
                        "blob_storage_shard_key": outboxMessageDocument["blob_storage_shard_key"],
                        "server_message_id": outboxMessageDocument["server_message_id"],
                        "timestamp": outboxMessageDocument["timestamp"]
                    }
                );

                console.log("message=");
                console.log(message.properties);
                //unknown_recipient_starter, server_message_id and owner_user_id
                message.generateMessageInstanceId();

                if(message.isValid()) {
                    console.log("trying to add to inbox");
                    CWMongoClient.getConnection(function (err, db) {
                        if (err) {
                            return waterfallCallback(err, null);
                        } else {
                            var collection = db.collection('messages');

                            //we do an update so retries can succeed
                            collection.update(
                                {"message_instance_id":message.properties["message_instance_id"]},
                                message.properties,
                                {"upsert":true, "multi": false},
                                function (err, updated) {

                                    if (!err) {
                                        waterfallCallback(null, outboxMessageDocument, message.properties);
                                    } else {
                                        waterfallCallback(err, null, null);
                                    }
                                });
                        }
                    })
                }
                else {
                    waterfallCallback("invalid message", null);
                }
            }
        ],
        function(err, outboxMessageDocument, inboxMessageDocument) {
            var response = new Response();
            if(err) {
                response.response_code = responseCodes["failure"];
            }
            else {
                response.response_code = responseCodes["success"];
                response.message_meta_data = ChatwalaMessageDocuments.createMetaDataJSON(outboxMessageDocument, false);
            }
            callback(err, response);
        }

        );
    };

    return {
        "responseCodes": responseCodes,
        "Request": Request,
        "execute": execute
    };
}());

module.exports = StartKnownRecipientMessageSend;


