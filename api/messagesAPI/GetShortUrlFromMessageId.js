/*******
 created by sam
 *******/

var config = require('./../../config.js');
var CWMongoClient = require('./../../cw_mongo.js');
var ChatwalaMessageDocuments = require("./ChatwalaMessageDocuments.js");
var ShortenHelper = require('../ShortenHelper.js');
var async = require('async');

var GetShortUrlFromMessageId = (function(){

    var responseCodes = {
        "success": {
            "code":1,
            "message":"The share url has been successfully generated"
        },
        "failureInvalidRequest": {
            "code":-101,
            "message":"Invalid request parameters provided."
        },
        "failure": {
            "code":-102,
            "message":"A failure occurred while trying to generate the share url"
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
        console.log("start");
        var message_id = request.message_id;
        var response = new Response();

        if(typeof message_id === 'undefined'){
            response.response_code = responseCodes["failureInvalidRequest"];
            callback("failureInvalidRequest",response);
            return;
        }

        if(config.returnShortUrls===false) {
            response.response_code = responseCodes["success"];
            var shard_key = config.azure.currentShardKey;
            response.share_url = config.share_base_url + shard_key + "." + message_id;
            callback(null, response);
            return;
        }

        //1. create shortened id
        var shortbase = ShortenHelper.createShortId(message_id);

        //2. find increment and save to db
        async.waterfall([
            //find increment
            function(waterfallCallback) {
                CWMongoClient.getConnection(function (err, db) {
                    if (err) {
                        console.log("error!");
                        waterfallCallback(err, null);
                    } else {
                        console.log("db call");
                        var collection = db.collection('messageshorts');
                        var query = {};
                        query["shortbase"] = shortbase;
                        //query["options"] = {"sort":['increment','desc']};

                        collection.findOne(
                            query,
                            null,
                            {"sort":[['increment','desc']]},
                            function(err, document) {
                                console.log("collisions checked for");
                                if(err) {
                                    console.log("error");
                                    waterfallCallback(err);
                                }
                                else {
                                    if(document) {
                                        if(document["message_id"]==message_id) {
                                            console.log("message found");
                                            waterfallCallback("messagefound", document["short"]);
                                        }
                                        else {
                                            var increment = document["increment"];
                                            var newIncrement = increment+1;
                                            console.log("new increment =" + newIncrement);
                                            waterfallCallback(null, newIncrement);
                                        }
                                    }
                                    else {
                                        console.log("document not found");
                                        waterfallCallback(null, 0);
                                    }
                                }
                            }
                        );
                    }
                });
            },
            //store in db
            function(increment, waterfallCallback) {
                console.log("storing in db, increment = " + increment);
                var short = shortbase;
                if(increment>0) {
                    short = ShortenHelper.incrementShortId(shortbase, increment);
                }

                CWMongoClient.getConnection(function (err, db) {
                    if (err) {
                        waterfallCallback(err);
                    } else {
                        var collection = db.collection('messageshorts');

                        var shortDoc = {
                            "shortbase": shortbase,
                            "short": short,
                            "message_id" : message_id,
                            "blob_storage_shard_key": config.azure.currentShardKey,
                            "increment": increment
                        };

                        console.log("shortDoc = ");
                        console.log(shortDoc);

                        collection.insert(shortDoc,
                            function (err, doc) {
                                waterfallCallback(err, short);
                            }
                        );
                    }
                });

            }
        ],
        function (err, short) {
            console.log("finish");
            var response = new Response();
            if(err=="messagefound") {
                console.log("duplicate");
                response.response_code = responseCodes["success"];
                response.share_url = config.short_base_url + short;
                callback(null, response);
                return;
            }
            else if(err) {
                console.log("failure");
                console.log(err);
                response.response_code = responseCodes["failure"];
                callback(err, response);
                return;
            }
            else {
                console.log("success");
                response.response_code = responseCodes["success"];
                response.share_url = config.short_base_url + short;
                callback(null, response);
                return;
            }
        }
        );

    };

    return{
        "responseCodes":responseCodes,
        "Request":Request,
        "execute":execute
    }

}());

module.exports = GetShortUrlFromMessageId;