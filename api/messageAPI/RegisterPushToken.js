/**
 * Created by samirahman on 2/24/14.
 */
var async = require('async');
var CWMongoClient = require('../../cw_mongo.js');
var ChatwalaMessageDocuments = require("./ChatwalaMessageDocuments.js");
var PushHelper = require("./../PushHelper.js");

var RegisterPushToken=(function() {

    var responseCodes = {
        "success": {
            "code":1,
            "message":"The message has been successfully saved"
        },
        "failure": {
            "code":-100,
            "message":"A failure occurred while trying to register this users push token"
        },
        "failureInvalidRequest": {
            "code":-101,
            "message":"Invalid request"
        }

    };

    var Request = function() {
        //platform_type, user_id, push_token
        this.platform_type=undefined;
        this.user_id= undefined;
        this.push_token = undefined;
    };

    var Response = function() {
        this.response_code=undefined;
    };

    var execute = function(request, callback) {
        if(request.push_token===undefined || request.user_id===undefined || request.platform_type===undefined) {
            var response = new Response();
            response.response_code = responseCodes["failureInvalidRequest"];
            callback("failureInvalidRequest", response);
            return;
        }

        PushHelper.registerPushToken(request.platform_type, request.user_id, request.push_token, function(err, result){
            if(!err) {
                var response = new Response();
                response.response_code = responseCodes["success"];
                callback(null, response);
                return;
            }
            else {
                var response = new Response();
                response.response_code = responseCodes["failure"];
                callback(null, response);
                return;
            }
        });
    };

    return {
        "responseCodes": responseCodes,
        "Request": Request,
        "execute": execute
    };
}());

module.exports = RegisterPushToken;


