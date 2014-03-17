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
        var response = new Response();

        if(typeof message_id === 'undefined'){
            response.response_code = responseCodes["failureInvalidRequest"];
            callback("failureInvalidRequest",response);
            return;
        }

        response.response_code = responseCodes["success"];
        var shard_key = azure.currentShardKey;

        response.share_url = config.share_base_url + shard_key + "." + message_id;

        callback(null, response);

    };

    return{
        "responseCodes":responseCodes,
        "Request":Request,
        "execute":execute
    }

}());

module.exports = GetShareUrlFromMessageId;