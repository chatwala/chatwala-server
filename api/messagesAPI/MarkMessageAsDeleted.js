/*******
 created by sam
 *******/

var config = require('./../../config.js');
var CWMongoClient = require('./../../cw_mongo.js');
var ChatwalaMessageDocuments = require("./ChatwalaMessageDocuments.js");
var async = require('async');

var MarkMessageAsDeleted = (function(){

    var responseCodes = {
        "success": {
            "code":1,
            "message":"Message has successfully been marked as deleted."
        },
        "failureInvalidRequest": {
            "code":-101,
            "message":"Invalid request parameters provided."
        },
        "failure": {
            "code":-102,
            "message":"A failure occurred while trying to delete."
        }
    };

    var Request = function() {
        this.message_id= undefined;
        this.user_id = undefined;
    };

    var Response = function() {
        this.response_code=undefined;
    };


    function execute(request, callback){
        console.log("start");
        var message_id = request.message_id;
        var user_id = request.user_id;
        var response = new Response();

        if(typeof message_id === 'undefined' || typeof user_id === 'undefined'){
            response.response_code = responseCodes["failureInvalidRequest"];
            callback("failureInvalidRequest",response);
            return;
        }

        CWMongoClient.getConnection(function (err, db) {
            if (err) {
                response.response_code = responseCodes["failure"];
                callback(err, response);

            } else {
                var collection = db.collection('messages');
                var message_instance_id = message_id  + "." + user_id + "." + ChatwalaMessageDocuments.ROLE_RECIPIENT;
                var query = {};
                query[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.MESSAGE_INSTANCE_ID] = message_instance_id;

                var update={};
                update[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.DELETED] = true;
                update[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.SHOWABLE] = false;
                var setCommand={"$set":update};
                collection.update(
                    query,
                    setCommand,
                    {},
                    function(err, numRecordsModified) {

                        if(err) {
                            response.response_code = responseCodes["failure"];
                            callback(err, response);
                        }
                        else {
                            response.response_code= responseCodes["success"];
                            callback(null, response);
                        }
                    }
                );
            }
        });


    };

    return{
        "responseCodes":responseCodes,
        "Request":Request,
        "execute":execute
    }

}());

module.exports = MarkMessageAsDeleted;