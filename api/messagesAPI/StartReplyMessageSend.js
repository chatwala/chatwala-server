var async = require('async');
var CWMongoClient = require('../../cw_mongo.js');
var ChatwalaMessageDocuments = require("./ChatwalaMessageDocuments.js");
var SASHelper = require("../SASHelper.js");

var StartReplyMessageSend=(function() {

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
        this.message_id=undefined;
        this.replying_to_message_id=undefined;
        this.start_recording=undefined;
        this.client_version_id=undefined;
    };

    var Response = function() {
        this.message_meta_data=undefined;
        this.response_code=undefined;
        this.write_url=undefined;
        this.message_thumbnail_write_url=undefined;
    };

    var execute = function(request, callback) {


        //make sure the request is a number
        request.start_recording = Number(request.start_recording);
        async.waterfall([
            //1. get replying_to_message
            function(waterfallCallback) {
                CWMongoClient.getConnection(function (err, db) {
                    if (err) {
                        return waterfallCallback(err, null);
                    } else {
                        var collection = db.collection('messages');

                        var query ={};
                        query[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OWNER_USER_ID]= request.owner_user_id;
                        query[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.MESSAGE_ID]= request.replying_to_message_id;

                        //make sure we are replying to the converted message and not the unknown_recipient_starter template
                        query[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.UNKNOWN_RECIPIENT_STARTER]=false;

                        collection.findOne(query,
                            function (err, doc) {


                                if (!err) {
                                    if(doc==null){
                                        waterfallCallback("failure", null);
                                    }
                                    else {
                                        waterfallCallback(null, doc);
                                    }
                                } else {
                                    console.log("Error finding replying_to_message");
                                    console.log(err);
                                    waterfallCallback(err, null);
                                }
                            });
                    }
                })
            },

            //2. put the message in the senders outbox
            function(originalMessageDocument, waterfallCallback) {

                var message = new ChatwalaMessageDocuments.Message();
                message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.VERSION] = ChatwalaMessageDocuments.getVersionIdByClientVersion(request.client_version_id);
                message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.MESSAGE_ID]=request.message_id;
                message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OWNER_USER_ID]=request.owner_user_id;
                message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OWNER_ROLE]=ChatwalaMessageDocuments.ROLE_SENDER;
                message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OTHER_USER_ID]=originalMessageDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.SENDER_ID];
                message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OTHER_USER_ROLE]=ChatwalaMessageDocuments.ROLE_RECIPIENT;
                message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.SENDER_ID]=request.owner_user_id;
                message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.RECIPIENT_ID]=originalMessageDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OTHER_USER_ID];
                message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.THREAD_INDEX]=Number(originalMessageDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.THREAD_INDEX])+1;
                message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.THREAD_ID]=originalMessageDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.THREAD_ID];
                message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.THREAD_STARTER]=false;
                message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.START_RECORDING]=request.start_recording;
                message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.GROUP_ID]=originalMessageDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.GROUP_ID];
                message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.REPLYING_TO_MESSAGE_ID]=request.replying_to_message_id;
                message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.UNKNOWN_RECIPIENT_STARTER]=false;
                message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.SHOWABLE]=true;

                message.generateBlobShardKey();
                message.generateMessageInstanceId();


                //update time stamp
                message.generateTimeStamp();

                if(message.isValid()) {

                    CWMongoClient.getConnection(function (err, db) {

                        if (err) {
                            console.log(err);
                            return waterfallCallback(err, null);
                        } else {
                            var collection = db.collection('messages');

                            //we do an update so retries can succeed
                            var propMessageInstanceId = ChatwalaMessageDocuments.MESSAGE_PROPERTIES.MESSAGE_INSTANCE_ID;
                            //delete message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.MESSAGE_INSTANCE_ID];

                            message.properties["last_modified"] = new Date().getTime();

                            collection.update(
                                {propMessageInstanceId:message.properties[propMessageInstanceId]},
                                message.properties,
                                {"upsert":true, "multi": false},
                                function (err, updated) {
                                    if (!err) {
                                        waterfallCallback(null, message.properties);
                                    } else {
                                        console.log("error trying to add to outbox");
                                        console.log(err);
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
                message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.VERSION] = ChatwalaMessageDocuments.getVersionIdByClientVersion(request.client_version_id);
                message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.MESSAGE_ID]=request.message_id;
                message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OWNER_USER_ID]=outboxMessageDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.RECIPIENT_ID];
                message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OWNER_ROLE]=ChatwalaMessageDocuments.ROLE_RECIPIENT;
                message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OTHER_USER_ID]=outboxMessageDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.SENDER_ID];
                message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OTHER_USER_ROLE]=ChatwalaMessageDocuments.ROLE_SENDER;
                message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.SENDER_ID]=outboxMessageDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.SENDER_ID];
                message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.RECIPIENT_ID]=outboxMessageDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.RECIPIENT_ID];
                message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.THREAD_INDEX]=outboxMessageDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.THREAD_INDEX];
                message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.THREAD_ID]=outboxMessageDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.THREAD_ID];
                message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.THREAD_STARTER]=false;
                message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.START_RECORDING]=outboxMessageDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.START_RECORDING];
                message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.GROUP_ID]=outboxMessageDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.GROUP_ID];
                message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.REPLYING_TO_MESSAGE_ID]=outboxMessageDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.REPLYING_TO_MESSAGE_ID];
                message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.UNKNOWN_RECIPIENT_STARTER]=false;
                message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.SHOWABLE]=false;
                message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.BLOB_STORAGE_SHARD_KEY]=outboxMessageDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.BLOB_STORAGE_SHARD_KEY];
                message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.TIMESTAMP]=outboxMessageDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.TIMESTAMP];

                //unknown_recipient_starter, message_id and owner_user_id
                message.generateMessageInstanceId();

                if(message.isValid()) {

                    CWMongoClient.getConnection(function (err, db) {
                        if (err) {
                            return waterfallCallback(err, null);
                        } else {
                            var collection = db.collection('messages');

                            //we do an update so retries can succeed
                            var propMessageInstanceId = ChatwalaMessageDocuments.MESSAGE_PROPERTIES.MESSAGE_INSTANCE_ID;
                            //delete message.properties[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.MESSAGE_INSTANCE_ID];

                            message.properties["last_modified"] = new Date().getTime();

                            collection.update(
                                {propMessageInstanceId:message.properties[propMessageInstanceId]},
                                message.properties,
                                {"upsert":true, "multi": false},
                                function (err, updated) {

                                    if (!err) {
                                        waterfallCallback(null, outboxMessageDocument, message.properties);
                                    } else {
                                        console.log("Error adding to inbox");
                                        console.log(err);
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
                console.log("Error at the end of the waterfall to follow:")
                console.log(err);
                response.response_code = responseCodes["failure"];
            }
            else {
                response.response_code = responseCodes["success"];
                response.write_url = SASHelper.getWriteSharedAccessPolicy(outboxMessageDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.BLOB_STORAGE_SHARD_KEY], outboxMessageDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.MESSAGE_ID]);
                response.message_thumbnail_write_url = SASHelper.getMessageThumbnailWriteUrl(outboxMessageDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.BLOB_STORAGE_SHARD_KEY], outboxMessageDocument[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.MESSAGE_ID]);
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

module.exports = StartReplyMessageSend;


