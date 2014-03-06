var async = require('async');
var CWMongoClient = require('../../cw_mongo.js');
var UserHelper = require('./UserHelper.js');
var ChatwalaMessageDocuments = require("../messagesAPI/ChatwalaMessageDocuments.js");

var CreateInitialUser = (function(){

	 var responseCodes = {
        "success": {
            "code":1,
            "message":"The user association has been created"
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


    function execute(user_message_document, callback){
        
        var user_id = user_message_document[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OWNER_USER_ID];
        var other_user_id = user_message_document[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OTHER_USER_ID];
        var user_type = UserHelper.ASSOCIATION_TYPE_FRIEND;
        var num_threads = 1;

        if(user_type === ChatwalaMessageDocuments.ROLE_RECIPIENT){
            var last_reply_timestamp = user_message_document[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.TIMESTAMP];
            var last_reply_message_id = user_message_document[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.MESSAGE_ID];
            var unread_count = 1;
        }
        

        CWMongoClient.getConnection(function (err, db) {
            if (err) {
                callback(err, null);
            } else {
                var collection = db.collection(UserHelper.USER_ASSOCIATION_COLLECTION);
                var query = {};
                query[UserHelper.USER_ASSOCIATION_PROPERTIES.USER_ASSOCIATION_ID] = user_id + "." + other_user_id;

                var create = {};
                create[UserHelper.USER_ASSOCIATION_PROPERTIES.USER_ASSOCIATION_ID] = user_id + "." + other_user_id;
                create[UserHelper.USER_ASSOCIATION_PROPERTIES.TYPE] = user_type
                create[UserHelper.USER_ASSOCIATION_PROPERTIES.OWNER_ID] = user_id;
                create[UserHelper.USER_ASSOCIATION_PROPERTIES.OTHER_USER_ID] = other_user_id;
                create[UserHelper.USER_ASSOCIATION_PROPERTIES.NUM_THREADS] = num_threads;

                if(user_type === ChatwalaMessageDocuments.ROLE_RECIPIENT){
                    create[UserHelper.USER_ASSOCIATION_PROPERTIES.LAST_REPLY_MESSAGE_ID] = last_reply_message_id;
                    create[UserHelper.USER_ASSOCIATION_PROPERTIES.LAST_REPLY_TIMESTAMP] = last_reply_timestamp;
                    create[UserHelper.USER_ASSOCIATION_PROPERTIES.UNREAD_COUNT] = unread_count;
                }

                collection.findAndModify(
                    query,
                    create,
                    {"upsert":true, "new":true},
                    function(dbErr, updated){
                        if(!dbErr){
                            var response = new Response();
                            response.response_code = responseCodes["success"];
                            callback()
                        }
                    })


            }
        });
    }


	return{
        "Request" : Request,
		"execute" : execute
	}

}())

module.exports = CreateInitialUser;