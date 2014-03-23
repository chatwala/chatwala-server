/*******
 created by sam
 *******/

var config = require('./../../config.js');
var CWMongoClient = require('./../../cw_mongo.js');
var ChatwalaMessageDocuments = require("./ChatwalaMessageDocuments.js");
var crc = require('crc');
var async = require('async');

var GetShareUrlFromMessageId = (function(){

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

        //1. create shortened url
        var checksum = crc.crc32(config.azure.currentShardKey + "." + message_id);
        var shortbase = ""+ crc.hex32(checksum);
        console.log("shortbase="+ shortbase);


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
                                            waterfallCallback(null, document["short"]);
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
                    var hexInc = increment.toString(32);
                    short = hexInc +"" + shortbase;
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
                                console.log("short inserted, callback=" + waterfallCallback);
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
            if(err) {
                response.response_code = responseCodes["failure"];
            }
            else {
                response.response_code = responseCodes["success"];
                response.share_url = config.share_base_url + short;
            }
            callback(err, response);
        }
        );

    };

    return{
        "responseCodes":responseCodes,
        "Request":Request,
        "execute":execute
    }

}());

module.exports = GetShareUrlFromMessageId;