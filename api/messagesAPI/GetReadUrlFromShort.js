/*******
 created by sam
 *******/

var config = require('./../../config.js');
var ChatwalaMessageDocuments = require("./ChatwalaMessageDocuments.js");
var SASHelper = require("../SASHelper.js");
var CWMongoClient = require('./../../cw_mongo.js');

var GetReadUrlFromShort = (function(){

    var responseCodes = {
        "success": {
            "code":1,
            "message":"The read url has been successfully returned"
        },
        "failureInvalidRequest": {
            "code":-101,
            "message":"Invalid request parameters provided."
        },
        "failure": {
            "code":-102,
            "message":"A failure occurred while trying to get the read url."
        }
    };

    var Request = function() {
        this.message_id=undefined;
    };

    var Response = function() {
        this.response_code=undefined;
        this.read_url=undefined;
    };

    function execute(request, callback){
        var short = request.short;

        if(typeof short === 'undefined'){
            var response = new Response();
            response.response_code = responseCodes["failureInvalidRequest"];
            callback("failureInvalidRequest",response);
            return;
        }

        //1. lookup messageshort document using short as the index
        CWMongoClient.getConnection(function (err, db) {
            if (err) {
                var response = new Response();
                response.response_code = responseCodes["failure"];
                callback("failure",response);
                return;
            } else {
                console.log("db call");
                var collection = db.collection('messageshorts');
                var query = {};
                query["short"] = short;

                collection.findOne(
                    query,
                    null,
                    {},
                    function(err, document) {
                        console.log("collisions checked for");
                        if(err) {
                            var response = new Response();
                            response.response_code = responseCodes["failure"];
                            callback("failure",response);
                            return;
                        }
                        else {
                            if(document) {
                                var response = new Response();
                                response.response_code = responseCodes["success"];
                                response.read_url = SASHelper.getMessageReadUrl(document["blob_storage_shard_key"], document["message_id"]);
                                callback(null,response);
                                return;
                            }
                            else {
                                var response = new Response();
                                response.response_code = responseCodes["failureInvalidRequest"];
                                callback("failureInvalidRequest",response);
                            }
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

module.exports = GetReadUrlFromShort;