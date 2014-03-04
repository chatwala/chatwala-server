/**
 * Created by samirahman on 2/24/14.
 */
var async = require('async');
var CWMongoClient = require('../../cw_mongo.js');
var ChatwalaMessageDocuments = require("./ChatwalaMessageDocuments.js");

var GetUserInbox=(function() {

    var responseCodes = {
        "success": {
            "code":1,
            "message":"Messages have been returned"
        },
        "failure": {
            "code":-100,
            "message":"A failure occurred while trying to fetch this threads messages"
        },
        "failureInvalidRequest": {
            "code":-101,
            "message":"Invalid request"
        }

    };

    var Request = function() {
        this.thread_id= undefined;
        this.first_id = undefined;
        this.user_id = undefined;
    };

    var Response = function() {
        this.response_code=undefined;
        this.messages = undefined;
        this.continue = undefined;
        this.first_id = undefined;
    };

    var page_size = 5;

    var execute = function(request, callback) {
        console.log("execute");
        if(request.user_id===undefined) {
            var response = new Response();
            response.response_code = responseCodes["failureInvalidRequest"];
            callback("failureInvalidRequest", response);
            return;
        }

        CWMongoClient.getConnection(function (err, db) {
            console.log(err);
            if (err) {
                var response = new Response();
                response.response_code = responseCodes["failure"];
                callback("failure", response);
                return;
            } else {
                var collection = db.collection('messages');
                var query = {};
                if(request.first_id!=undefined) {
                    query["_id"] = {"$gt": request.first_id};
                }

                query[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OWNER_USER_ID] = request.user_id;
                query[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OWNER_ROLE] = ChatwalaMessageDocuments.ROLE_RECIPIENT;
                query[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.SHOWABLE] = true;

                console.log(query);

                //always grab 1 extra record so we know there are more pages
                collection.find(
                    query,
                    {"limit": page_size+1, "sort":{"_id":-1}},
                    function(err, cursor) {
                        if(err) {
                            var response = new Response();
                            response.response_code = responseCodes["failure"];
                            callback(err, response);
                        }
                        else {
                            cursor.toArray(function(err, documents) {
                                console.log(documents);
                                var messagesArray = [];
                                var response = new Response();
                                response.response_code = responseCodes["success"];
                                response.continue =false;

                                if(documents.length> page_size) {
                                    var lastElement = documents.pop();
                                    response.continue=true;
                                    response.first_id = lastElement["_id"];
                                }

                                for(var i=0; i<documents.length;i++) {
                                    messagesArray.push(ChatwalaMessageDocuments.createMetaDataJSON(documents[i], true));
                                }

                                response.messages = messagesArray;
                                callback(null, response);
                            });

                        }
                    }
                );
            }
        });
    };

    return {
        "responseCodes": responseCodes,
        "Request": Request,
        "execute": execute
    };
}());

module.exports = GetUserInbox;


