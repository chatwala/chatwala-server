/****
Created by Kevin Miller on 3/4/14
****/

var UserHelper = require('./UserHelper.js');
var SASHelper = require('../SASHelper.js');


var UploadUserProfilePicture = (function(){

    var responseCodes = {
	    "success": {
	        "code":1,
	        "message":"The profile picture SAS Url has been provided"
	    },
	    "failure": {
	        "code":-100,
	        "message":"A failure occurred while trying to retrieve a SAS URL"
	    },
	    "failureInvalidRequest": {
	        "code":-101,
	        "message":"Invalid request"
	    }

    };

	var Request = function() {
        this.user_id=undefined;
    };

    var Response = function() {
    	this.sasURL=undefined;
        this.response_code=undefined;
    };


	var execute = function(request, callback){
		
		if(typeof request.user_id === 'undefined'){
			var response = new Response();
			response.response_code = responseCodes['failureInvalidRequest'];
			callback("failureInvalidRequest", response);
			return;
		}

		SASHelper.getProfilePictureUploadURL(request.user_id, function(err, sasUploadURL){
			if(!err){
				var response = new Response();
				response.sasURL = sasUploadURL;
				response.response_code = responseCodes['success'];
				callback("success", response);
				return;
			}
			else{
				var response = new Response();
				response.response_code = responseCodes['failure'];
				callback("failure", response);
				return;
			}
		})

	}

	return {
		"execute" : execute,
		"Request" : Request
	}
}())

module.exports = UploadUserProfilePicture