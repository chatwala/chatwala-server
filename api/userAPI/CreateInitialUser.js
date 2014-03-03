var async = require('async');
var CWMongoClient = require('../../cw_mongo.js');
var PushHelper = require("./../PushHelper.js");
var UserHelper = require('./UserHelper.js');

var CreateInitialUser = (function(){

	 var responseCodes = {
        "success": {
            "code":1,
            "message":"The thread has been created"
        },
        "failure": {
          "code": -100,
           "message": "Something went wrong, unable to create a user. Try again"
        },
        "failureInvalidMessageDocument":{
            "code":-101,
            "message":"invalid message document"
        },
        "failureInvalidThreadDocument":{
            "code":-101,
            "message":"invalid message document"
        },
        "failureDBConnect": {
            "code":-200,
            "message":"Unable to connect to the db"
        },
        "failureDBSave": {
            "code": -201,
            "message": "Unable to save user document to db"
        }
    };


    var Request = function() {
        this.message_id = undefined;
    };

    var Response = function() {
        this.response_code=undefined;
    };


    function execute(user_id, other_user_id, callback){
        CWMongoClient.getConnection(function (err, db) {
            if (err) {
                callback(err, null);
            } else {
                var collection = db.collection('users');
                var query = {};
                query[UserHelper.USER_ASSOCIATION_PROPERTIES.USER_ASSOCIATION_ID] = 
            }
        });
    }


	return{
		"execute" : execute
	}

}())

module.exports = CreateInitialUser;