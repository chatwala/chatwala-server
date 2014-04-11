/**
 * Created by kevin on 4/11/14.
 */

var CWMongoClient = require('./../../cw_mongo.js');
var ChatwalaMessageDocuments = require("./ChatwalaMessageDocuments.js");
var SASHelper = require("./../SASHelper.js");

var GetMessageThumbnail = (function(){

    var responseCodes = {
        "success": {
            "code":1,
            "message":"The message thumbnail url has been successfully returned"
        },
        "failure": {
            "code":-102,
            "message":"A failure occurred while trying to get the read url."
        }
    };


    var Request = function(){
        this.share_id=undefined;
    };

    var Response = function(){
        this.message_thumbnail_url=undefined;
    };


    var execute = function(request, callback){
        console.log(request.share_id);
        var share_id = request.share_id;

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
                query["short"] = share_id;

                collection.findOne(
                    query,
                    null,
                    {},
                    function(err, document) {
                        var response = new Response();

                        if(err) {
                            response.response_code = responseCodes["failure"];
                            callback("failure",response);
                            return;
                        }
                        else {
                            if(document) {
                                response.message_thumbnail_url = SASHelper.getMessageThumbnailUrl(document["blob_storage_shard_key"], document["message_id"]);
                                callback(null,response);
                                return;
                            }
                            else {
                                response.response_code = responseCodes["failureInvalidRequest"];
                                callback("failureInvalidRequest",response);
                            }
                        }
                    }
                );
            }
        });

    };



    return {
        "execute" : execute,
        "Request" : Request,
        "responseCodes":responseCodes
    }

}())

module.exports = GetMessageThumbnail;