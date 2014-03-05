/*******
    created by kevin_miller on 3/5/14
 *******/

var config = require('./../../config.js');

var GetReadURLForMessage = (function(){

    var responseCodes = {
        "success": {
            "code":1,
            "message":"The read_url has been successfully sent."
        },
        "failureInvalidRequest": {
            "code":-101,
            "message":"You provided invalid request parameters"
        }
    };

    var Request = function() {
        //platform_type, user_id, push_token
        this.message_id=undefined;
        this.shard_key= undefined;
    };

    var Response = function() {
        this.response_code=undefined;
        this.read_url=undefined;
    };

    function execute(request, callback){

        if(typeof request.message_id === 'undefined' || typeof request.shard_key === 'undefined'){
            var response = new Response();
            response.response_code = responseCodes["failureInvalidRequest"];
            callback("failureInvalidRequest",response);
        }

        var read_url_for_message = config.azure.blobStorageShard[request.shard_key].base_url + request.message_id;

        var response = new Response();
        response.response_code = responseCodes["success"];
        response.read_url = read_url_for_message;
        callback(null, response);

    }

    return{
        "responseCodes":responseCodes,
        "Request":Request,
        "execute":execute
    }

}());

module.exports = GetReadURLForMessage;