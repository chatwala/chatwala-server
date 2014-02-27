/***
	created by kevinmiller on 2/27/14
**/

var config = require('../config.js')();
var azure = require('azure');
var Message = require('./ChatwalaMessageDocument.js');


var UserHelper = (function(){

	var ASSOCIATION_TYPE_FRIEND="FRIEND";
	var ASSOCIATION_TYPE_FOLLOWER="FOLLOWER";

	var USER_ASSOCIATION_PROPERTIES = {};
	USER_ASSOCIATION_PROPERTIES.USER_ASSOCIATION_ID="user_association_id"; //unique
	USER_ASSOCIATION_PROPERTIES.TYPE="type";
	USER_ASSOCIATION_PROPERTIES.OWNER_ID="owner_id"; 
	USER_ASSOCIATION_PROPERTIES.OTHER_USER_ID="other_user_id";
	USER_ASSOCIATION_PROPERTIES.LAST_REPLY_SERVER_MESSAGE_ID="last_reply_server_message_id";
	USER_ASSOCIATION_PROPERTIES.LAST_REPLY_TIMESTAMP = "last_reply_timestamp";
	USER_ASSOCIATION_PROPERTIES.UNREAD_COUNT="unread_count";
	USER_ASSOCIATION_PROPERTIES.NUM_THREADS = "num_threads";

  function incrementNumberOfThreadsForUser(owner_id, other_user_id callback) {
        CWMongoClient.getConnection(function (err, db) {
            if (err) {
                callback(err, null);
            } else {
                var collection = db.collection('users');
                var query = {};
                query[USER_ASSOCIATION_PROPERTIES.USER_ASSOCIATION_ID] = owner_id + "." + other_user_id;
                collection.findAndModify(
                    query,
                    {"$inc":{USER_ASSOCIATION_PROPERTIES.NUM_THREADS:1}},
                    {"multi":true, upsert:true},
                    function(err, doc) {
                        callback(null, doc);
                    }
                );
            }
        });
    }

    function decrementNumberOfThreadsForUser(owner_id, other_user_id, callback) {
        CWMongoClient.getConnection(function (err, db) {
            if (err) {
                callback(err, null);
            } else {
                var collection = db.collection('users');
                var query = {};
                query[USER_ASSOCIATION_PROPERTIES.USER_ASSOCIATION_ID] = owner_id + "." + other_user_id;
                collection.findAndModify(
                    query,
                    {"$inc":{USER_ASSOCIATION_PROPERTIES.NUM_THREADS:-1}},
                    {"multi":true, upsert:true},
                    function(err, doc) {
                        callback(null, doc);
                    }
                );
            }
        });
    }

    function incrementUnreadCountForUser(owner_id, other_user_id, callback){
        CWMongoClient.getConnection(function (err, db) {
            if (err) {
                callback(err, null);
            } else {
                var collection = db.collection('users');
                var query = {};
                query[USER_ASSOCIATION_PROPERTIES.USER_ASSOCIATION_ID] = owner_id + "." + other_user_id;
                collection.findAndModify(
                    query,
                    {"$inc":{USER_ASSOCIATION_PROPERTIES.UNREAD_COUNT:1}},
                    {"multi":true, upsert:true},
                    function(err, doc) {
                        callback(null, doc);
                    }
                );
            }
        });
    }

    function decrementUnreadCountForUser(owner_id, other_user_id, callback){
        CWMongoClient.getConnection(function (err, db) {
            if (err) {
                callback(err, null);
            } else {
                var collection = db.collection('users');
                var query = {};
                query[USER_ASSOCIATION_PROPERTIES.USER_ASSOCIATION_ID] = owner_id;
                collection.findAndModify(
                    query,
                    {"$inc":{USER_ASSOCIATION_PROPERTIES.UNREAD_COUNT:-1}},
                    {"multi":true, upsert:true},
                    function(err, doc) {
                        callback(null, doc);
                    }
                );
            }
        });
    }

}());

module.exports = UserHelper;