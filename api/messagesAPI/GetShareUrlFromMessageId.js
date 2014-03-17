/*******
 created by kevin_miller on 3/17/14
 *******/

var config = require('./../../config.js');
var CWMongoClient = require('./../../cw_mongo.js');
var ChatwalaMessageDocuments = require("./ChatwalaMessageDocuments.js");

var GetShareUrlFromMessageId = (function(){

    var responseCodes = {
        "success": {
            "code":1,
            "message":"The share has been successfully sent."
        },
        "failureDBOpen": {
            "code":-201,
            "message": "Unable to retrieve message from db."
        },
        "failureDBFind" : {
            "code":-202,
            "message":"Unable to find message in db. "
        },
        "failureInvalidRequest": {
            "code":-101,
            "message":"Invalid request parameters provided."
        }
    };

    var Request = function() {
        this.message_id=undefined;
    };

    var Response = function() {
        this.response_code=undefined;
        this.share_url=undefined;
    };

    function execute(request, callback){
        var message_id = request.message_id;

        if(typeof message_id === 'undefined'){
            var response = new Response();
            response.response_code = responseCodes["failureInvalidRequest"];
            callback("failureInvalidRequest",response);
            return;
        }

        CWMongoClient.getConnection(function (err, db) {
            var response = new Response();
            if (!err) {

                var collection = db.collection("messages");

                var query = {};
                query[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.MESSAGE_ID] = message_id;

                var return_parameters = {}
                return_parameters[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.BLOB_STORAGE_SHARD_KEY] = 1;

                collection.findOne(query, return_parameters, function(db_err, doc){
                    if(!db_err && doc){

                        response.response_code = responseCodes["success"];
                        var shard_key = doc[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.BLOB_STORAGE_SHARD_KEY];
                        var url = config.azure.blobStorageShard[shard_key].base_url + message_id;

                        response.share_url = url;
                        callback(null, response);
                    }
                    else{
                        response.response_code = responseCodes["failureDBFind"];
                        callback("failureDBFind", response);
                    }
                })
            } else {
                response.response_code = responseCodes["failureDBOpen"];
                callback("failureDBSave", response)
            }
        })


    }

    return{
        "responseCodes":responseCodes,
        "Request":Request,
        "execute":execute
    }

}());

module.exports = GetShareUrlFromMessageId;