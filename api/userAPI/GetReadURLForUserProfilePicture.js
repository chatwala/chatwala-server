/*******
 created by kevin_miller on 3/8/14
 *******/

var config = require('./../../config.js');

var GetReadURLForUserProfilePicture = (function(){

    var responseCodes = {
        "success": {
            "code":1,
            "message":"The profile_url has been successfully sent."
        },
        "failureInvalidRequest": {
            "code":-101,
            "message":"You provided invalid request parameters"
        }
    };

    var Request = function() {
        //platform_type, user_id, push_token
        this.user_id=undefined;
    };

    var Response = function() {
        this.response_code=undefined;
        this.profile_url=undefined;
    };

    function execute(request, callback){
        var user_id = request.user_id;

        if(typeof user_id === 'undefined'){
            var response = new Response();
            response.response_code = responseCodes["failureInvalidRequest"];
            callback("failureInvalidRequest",response);
        }

        var read_url_for_profile_pic = config.azure.nonShardedBlobStorage.base_url + user_id;

        var response = new Response();
        response.response_code = responseCodes["success"];
        response.profile_url = read_url_for_profile_pic;
        callback(null, response);

    }

    return{
        "responseCodes":responseCodes,
        "Request":Request,
        "execute":execute
    }

}());

module.exports = GetReadURLForUserProfilePicture;