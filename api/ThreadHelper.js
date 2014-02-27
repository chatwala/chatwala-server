/**
 * Created by samirahman on 2/24/14.
 */

var config = require('../config.js');
var azure = require('azure');

var ThreadHelper=(function() {

    var THREAD_ROLE_STARTER = "THREAD_STARTER";
    var THREAD_ROLE_REPLIER = "THREAD_REPLIER";


    var THREAD_PROPERTIES = {};
    THREAD_PROPERTIES.THREAD_ID="thread_id";
    THREAD_PROPERTIES.OWNER_ID="owner_id";
    THREAD_PROPERTIES.THREAD_INSTANCE_ID="thread_instance_id";
    THREAD_PROPERTIES.OTHER_USER_ID="other_user_id";
    THREAD_PROPERTIES.OWNER_THREAD_ROLE="owner_thread_role";
    THREAD_PROPERTIES.LAST_REPLY_SERVER_MESSAGE_ID="last_reply_server_message_id";
    THREAD_PROPERTIES.LAST_REPLY_TIMESTAMP = "last_reply_timestamp";
    THREAD_PROPERTIES.UNREAD_COUNT="unread_count";


    var ASSOCIATION_TYPE_FRIEND="FRIEND";
    var ASSOCIATION_TYPE_FOLLOWER="FOLLOWER";

    var USER_ASSOCIATION_PROPERTIES = {};
    USER_ASSOCIATION_PROPERTIES.TYPE="type";
    USER_ASSOCIATION_PROPERTIES.OWNER_ID="owner_id";
    USER_ASSOCIATION_PROPERTIES.OTHER_USER_ID="other_user_id";
    USER_ASSOCIATION_PROPERTIES.LAST_REPLY_SERVER_MESSAGE_ID="last_reply_server_message_id";
    USER_ASSOCIATION_PROPERTIES.LAST_REPLY_TIMESTAMP = "last_reply_timestamp";
    USER_ASSOCIATION_PROPERTIES.UNREAD_COUNT="unread_count";
    USER_ASSOCIATION_PROPERTIES.NUM_THREADS = "num_threads";

    function incrementNumberOfThreadsForUser() {

    }

    function decrementNumberOfThreadsForUser() {

    }

    function decrementUnreadCountForUser(owner_id, other_user_id, callback){

    }

    function incrementUnreadCountForUser(woo){

    }

    function decrementUnreadCountForThread(thread_id, owner_id, callback) {

    }

    function incrementUnreadCountForThread(thread_id, owner_id, callback) {

    }

    //creates a new thread
    function setLastMessageForThread(thread_id, owner_id, last_message_id, last_message_timestamp, callback) {
        //findAndModify
        //upsert
        CWMongoClient.getConnection(function (err, db) {
            if (err) {
                seriesCallback(err, null);
            } else {
                var collection = db.collection('threads');
                var query = {};
                query[THREAD_PROPERTIES.THREAD_INSTANCE_ID] = owner_id + "." + thread_id ;
                collection.findAndModify(
                    query,
                    [['_id','asc']],
                    {"$set":{"uploaded":true}},
                    {"multi":true},
                    function(err, doc) {
                        seriesCallback(null, doc);
                    }
                );
            }
        });
    }

    return {
        "registerPushToken": registerPushToken,
        "sendPush": sendPush
    }
}());

module.exports = ThreadHelper;