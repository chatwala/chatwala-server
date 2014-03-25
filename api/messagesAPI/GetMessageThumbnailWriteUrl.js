/****
Created by Kevin Miller on 3/25/14
****/
var SASHelper = require('../SASHelper.js');


var GetMessageThumbnailWriteUrl = (function(){

    var responseCodes = {
	    "success": {
	        "code":1,
	        "message":"The message thumbnail SAS Url has been provided"
	    },
	    "failure": {
	        "code":-100,
	        "message":"A failure occurred while trying to retrieve a thumbnail write SAS URL"
	    },
	    "failureInvalidRequest": {
	        "code":-101,
	        "message":"Invalid request"
	    }

    };

	var Request = function() {
        this.message_id=undefined;
        this.shard_key=undefined;
    };

    var Response = function() {
    	this.write_url=undefined;
        this.response_code=undefined;
    };


	var execute = function(request, callback){

		if(typeof request.message_id === 'undefined' || typeof request.shard_key === 'undefined'){
			var response = new Response();
			response.response_code = responseCodes['failureInvalidRequest'];
			callback("failureInvalidRequest", response);
			return;
		}

		var write_url = SASHelper.getMessageThumbnailWriteUrl(request.shard_key,request.message_id);

		if(typeof write_url !== "undefined"){
			var response = new Response();
			response.write_url = write_url;
			response.response_code = responseCodes['success'];
			callback(null, response);
			return;
		}
		else{
			var response = new Response();
			response.response_code = responseCodes['failure'];
			callback("failure", response);
			return;
		}

	}

	return {
		"execute" : execute,
		"Request" : Request
	}
}())

module.exports = GetMessageThumbnailWriteUrl