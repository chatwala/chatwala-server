var async = require('async');
var CWMongoClient = require('../../cw_mongo.js');
var ChatwalaMessageDocuments = require("./ChatwalaMessageDocuments.js");
var SASHelper = require("../SASHelper.js");

var RenewWriteSASURL=(function() {

    var responseCodes = {
        "success": {
            "code":1,
            "message":"The SASURL has been generated and returned successfully"
        },
        "failure": {
            "code":-100,
            "message": "unknown failure"
        },
        "failureInvalidServerMessageId": {
            "code":-101,
            "message": "invalid server message id"
        }
    };


    var Request = function() {
        this.message_id = undefined;
    };

    var Response = function() {
        this.response_code=undefined;
        this.write_url = undefined;
    };

    /*
    Set uploaded to true on the original document
     */
    var execute = function(request, callback) {
        console.log("message_id="+request.message_id);
        if(request.message_id === undefined) {
            var response = new Response();
            response.message_meta_data = {};
            response.response_code = responseCodes["failureInvalidServerMessageId"];
            callback("failureInvalidServerMessageId", response);
            return;
        }

        var write_url = SASHelper.getWriteSharedAccessPolicy(request.message_id);
        var response = new Response();
        response.responseCode = responseCodes["success"];
        response.write_url = write_url;
        callback(null, response);
    };

    return {
        "responseCodes": responseCodes,
        "Request": Request,
        "execute": execute
    };
}());

module.exports = RenewWriteSASURL;


