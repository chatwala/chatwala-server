var GUIDUtil = require('GUIDUtil');
var SASHelper = require('../SASHelper.js');

var ChatwalaMessageDocuments=(function() {

    var ROLE_SENDER = "SENDER";
    var ROLE_RECIPIENT = "RECIPIENT";
    var RECIPIENT_UNKNOWN = "RECIPIENT_UNKNOWN";
    var VERSION = 2.0;

    var MESSAGE_PROPERTIES = {};
    MESSAGE_PROPERTIES.MESSAGE_INSTANCE_ID="message_instance_id";
    MESSAGE_PROPERTIES.CLIENT_MESSAGE_ID="client_message_id";
    MESSAGE_PROPERTIES.SERVER_MESSAGE_ID="server_message_id";
    MESSAGE_PROPERTIES.OWNER_USER_ID="owner_user_id";
    MESSAGE_PROPERTIES.OWNER_ROLE="owner_role";
    MESSAGE_PROPERTIES.OTHER_USER_ID="other_user_id";
    MESSAGE_PROPERTIES.OTHER_USER_ROLE="other_user_role";
    MESSAGE_PROPERTIES.SENDER_ID="sender_id";
    MESSAGE_PROPERTIES.RECIPIENT_ID="recipient_id";
    MESSAGE_PROPERTIES.GROUP_ID="group_id";
    MESSAGE_PROPERTIES.THREAD_ID="thread_id";
    MESSAGE_PROPERTIES.THREAD_COUNT="thread_count";
    MESSAGE_PROPERTIES.BLOB_STORAGE_SHARD_KEY="blob_storage_shard_key";
    MESSAGE_PROPERTIES.UNKNOWN_RECIPIENT_STARTER="unknown_recipient_starter";
    MESSAGE_PROPERTIES.UPLOADED="uploaded";
    MESSAGE_PROPERTIES.DELIVERED="delivered";
    MESSAGE_PROPERTIES.VIEWED="viewed";
    MESSAGE_PROPERTIES.REPLIED="replied";
    //MESSAGE_PROPERTIES.REPLIED_BY_SERVER_MESSAGE_ID="replied_by_server_message_id";
    MESSAGE_PROPERTIES.REPLYING_TO_SERVER_MESSAGE_ID="replying_to_server_message_id";
    MESSAGE_PROPERTIES.SHOWABLE="showable";
    MESSAGE_PROPERTIES.TIMESTAMP="timestamp";
    MESSAGE_PROPERTIES.DECRYPTION_KEY="decryption_key";
    MESSAGE_PROPERTIES.THREAD_STARTER="thread_starter";
    MESSAGE_PROPERTIES.START_RECORDING="start_recording";
    MESSAGE_PROPERTIES.READ_URL="read_url";
    MESSAGE_PROPERTIES.VERSION="version";


    function Message() {

        this.getTemplate = function() {
           var template={};
                template[MESSAGE_PROPERTIES.MESSAGE_INSTANCE_ID]=undefined; //blob_storage_shard_key.client_message_id.owner_id
                template[MESSAGE_PROPERTIES.CLIENT_MESSAGE_ID]= undefined;   //defined by client, not really used
                template[MESSAGE_PROPERTIES.SERVER_MESSAGE_ID]= undefined;  //blob_storage_shard_key.client_message_id
                template[MESSAGE_PROPERTIES.OWNER_USER_ID]= undefined;
                template[MESSAGE_PROPERTIES.OWNER_ROLE]= undefined;
                template[MESSAGE_PROPERTIES.OTHER_USER_ID]= undefined;
                template[MESSAGE_PROPERTIES.OTHER_USER_ROLE]= undefined;
                template[MESSAGE_PROPERTIES.SENDER_ID]= undefined;
                template[MESSAGE_PROPERTIES.RECIPIENT_ID]= undefined;
                template[MESSAGE_PROPERTIES.GROUP_ID]=undefined;
                template[MESSAGE_PROPERTIES.THREAD_ID]= undefined;
                template[MESSAGE_PROPERTIES.THREAD_COUNT]=undefined;
                template[MESSAGE_PROPERTIES.THREAD_STARTER]=undefined;
                template[MESSAGE_PROPERTIES.BLOB_STORAGE_SHARD_KEY]=undefined;
                template[MESSAGE_PROPERTIES.UNKNOWN_RECIPIENT_STARTER]= undefined;
                template[MESSAGE_PROPERTIES.UPLOADED]=false;
                template[MESSAGE_PROPERTIES.DELIVERED]=false;
                template[MESSAGE_PROPERTIES.VIEWED]=false;
                template[MESSAGE_PROPERTIES.REPLIED]= false;
                template[MESSAGE_PROPERTIES.REPLYING_TO_SERVER_MESSAGE_ID]=null;
                template[MESSAGE_PROPERTIES.SHOWABLE]=false;
                template[MESSAGE_PROPERTIES.TIMESTAMP]=undefined; //since epoch
                template[MESSAGE_PROPERTIES.DECRYPTION_KEY]=null;
                template[MESSAGE_PROPERTIES.START_RECORDING]=undefined;
                template[MESSAGE_PROPERTIES.READ_URL]=undefined;
                template[MESSAGE_PROPERTIES.VERSION]=VERSION;


            return template;
        }

        this.properties = this.getTemplate();

        this.setPropsFromDictionary = function(props) {
            for(var property in props) {
                if(property!="_id") {
                    this.properties[property] = props[property];
                }
            }
        }
        this.generateServerMessageId=function() {
            if(this.properties[MESSAGE_PROPERTIES.CLIENT_MESSAGE_ID]===undefined || this.properties[MESSAGE_PROPERTIES.BLOB_STORAGE_SHARD_KEY]===undefined) {
                throw "client_message_id and blob_storage_shard_key must be defined";
            }
            this.properties[MESSAGE_PROPERTIES.SERVER_MESSAGE_ID] = this.properties[MESSAGE_PROPERTIES.BLOB_STORAGE_SHARD_KEY] + "." + this.properties[MESSAGE_PROPERTIES.CLIENT_MESSAGE_ID];

        }

        this.generateMessageInstanceId=function() {
            if(this.properties[MESSAGE_PROPERTIES.UNKNOWN_RECIPIENT_STARTER]===undefined || this.properties[MESSAGE_PROPERTIES.SERVER_MESSAGE_ID]===undefined || this.properties[MESSAGE_PROPERTIES.OWNER_USER_ID]===undefined) {
                throw "unknown_recipient_starter, server_message_id and owner_user_id must be defined";
            }

            this.properties[MESSAGE_PROPERTIES.MESSAGE_INSTANCE_ID] = this.properties[MESSAGE_PROPERTIES.SERVER_MESSAGE_ID] + "." + this.properties[MESSAGE_PROPERTIES.OWNER_USER_ID] + (this.properties[MESSAGE_PROPERTIES.UNKNOWN_RECIPIENT_STARTER]===true ? ".UNKNOWN_RECIPIENT_STARTER": "");
        }

        this.generateThreadInformation=function() {
            if(this.properties[MESSAGE_PROPERTIES.SERVER_MESSAGE_ID]===undefined || this.properties[MESSAGE_PROPERTIES.SENDER_ID]===undefined || this.properties[MESSAGE_PROPERTIES.RECIPIENT_ID]===undefined ) {
                throw "server_message_id, sender_id and recipient_id must be defined"
            }

            this.properties[MESSAGE_PROPERTIES.THREAD_ID] = this.properties[MESSAGE_PROPERTIES.SERVER_MESSAGE_ID] + "." + this.properties[MESSAGE_PROPERTIES.SENDER_ID] + "." + this.properties[MESSAGE_PROPERTIES.RECIPIENT_ID];
            this.properties[MESSAGE_PROPERTIES.THREAD_COUNT] = 0;
        }

        this.generateGroupId=function() {
            this.properties[MESSAGE_PROPERTIES.GROUP_ID] = GUIDUtil.GUID();
        }

        this.generateBlobShardKey=function() {
            this.properties[MESSAGE_PROPERTIES.BLOB_STORAGE_SHARD_KEY] = SASHelper.getCurrentShardKey();
        }

        this.generateTimeStamp= function() {
            this.properties[MESSAGE_PROPERTIES.TIMESTAMP]=(new Date()).getTime();
        }

        this.generateReadURL = function() {
            if(this.properties[MESSAGE_PROPERTIES.SERVER_MESSAGE_ID]===undefined) {
                throw "server_message_id must be defined";
            }
            this.properties[MESSAGE_PROPERTIES.READ_URL] = SASHelper.getReadSharedAccessPolicy(this.properties[MESSAGE_PROPERTIES.SERVER_MESSAGE_ID]);
        }

        this.isValid=function() {
            console.log("validating message");

            //clear any weird or invalid props that may have been added by creating a new properties document
            var newProps = this.getTemplate();
            for(var property in newProps) {
                newProps[property] = this.properties[property];
            }

            this.properties=newProps;

            //check for undefined values
           for(var property in this.properties) {
               if(this.properties[property]===undefined) {
                   console.log("undefined found for " + property);
                   return false;
               }
           }
           return true;
        }


    }


    function createMetaDataJSON(properties, blnIncludeDecryptionKey) {
       var metaDataJSON={};

           metaDataJSON[MESSAGE_PROPERTIES.CLIENT_MESSAGE_ID]=properties[MESSAGE_PROPERTIES.CLIENT_MESSAGE_ID];
           metaDataJSON[MESSAGE_PROPERTIES.SERVER_MESSAGE_ID]=properties[MESSAGE_PROPERTIES.SERVER_MESSAGE_ID];
           metaDataJSON[MESSAGE_PROPERTIES.MESSAGE_INSTANCE_ID]=properties[MESSAGE_PROPERTIES.MESSAGE_INSTANCE_ID];
           metaDataJSON[MESSAGE_PROPERTIES.SENDER_ID]=properties[MESSAGE_PROPERTIES.SENDER_ID];
           metaDataJSON[MESSAGE_PROPERTIES.RECIPIENT_ID]=properties[MESSAGE_PROPERTIES.RECIPIENT_ID];
           metaDataJSON[MESSAGE_PROPERTIES.TIMESTAMP]=properties[MESSAGE_PROPERTIES.TIMESTAMP];
           metaDataJSON[MESSAGE_PROPERTIES.THREAD_ID]=properties[MESSAGE_PROPERTIES.THREAD_ID];
           metaDataJSON[MESSAGE_PROPERTIES.THREAD_COUNT]=properties[MESSAGE_PROPERTIES.THREAD_COUNT];
           metaDataJSON[MESSAGE_PROPERTIES.GROUP_ID]=properties[MESSAGE_PROPERTIES.GROUP_ID];
           metaDataJSON[MESSAGE_PROPERTIES.START_RECORDING]=properties[MESSAGE_PROPERTIES.START_RECORDING];
           metaDataJSON[MESSAGE_PROPERTIES.READ_URL]=properties[MESSAGE_PROPERTIES.READ_URL];

       return metaDataJSON;
    }

    function createNewStarterUnknownRecipientMessage(client_message_id, sender_id) {

        console.log("client_message_id=" + client_message_id + " sender_id =" + sender_id);
        var message = new Message();
        message.properties[MESSAGE_PROPERTIES.CLIENT_MESSAGE_ID]= client_message_id;
        message.properties[MESSAGE_PROPERTIES.OWNER_USER_ID]=sender_id;
        message.properties[MESSAGE_PROPERTIES.OWNER_ROLE]= ROLE_SENDER;
        message.properties[MESSAGE_PROPERTIES.OTHER_USER_ID]= RECIPIENT_UNKNOWN;
        message.properties[MESSAGE_PROPERTIES.OTHER_USER_ROLE]= ROLE_RECIPIENT;
        message.properties[MESSAGE_PROPERTIES.RECIPIENT_ID]= RECIPIENT_UNKNOWN;
        message.properties[MESSAGE_PROPERTIES.SENDER_ID]= sender_id;
        message.properties[MESSAGE_PROPERTIES.UNKNOWN_RECIPIENT_STARTER]= true;
        message.properties[MESSAGE_PROPERTIES.THREAD_STARTER]=true;
        message.properties[MESSAGE_PROPERTIES.START_RECORDING]=0;
        message.properties[MESSAGE_PROPERTIES.VIEWED]=false;


        console.log("message=");
        console.log(message.properties);

        try {
            message.generateBlobShardKey();
            message.generateServerMessageId();
            message.generateMessageInstanceId();
            message.generateThreadInformation();
            message.generateGroupId();
            message.generateTimeStamp();
            message.generateReadURL();
            console.log(message.properties);
            return message;
        }
        catch(e) {
            console.log(e);
            return null;
        }

    }

    return {
        "Message": Message,
        "ROLE_SENDER": ROLE_SENDER,
        "ROLE_RECIPIENT": ROLE_RECIPIENT,
        "RECIPIENT_UNKNOWN":RECIPIENT_UNKNOWN,
        "createNewStarterUnknownRecipientMessage": createNewStarterUnknownRecipientMessage,
        //"createNewKnownRecipientMessage": createNewKnownRecipientMessage,
        "createMetaDataJSON": createMetaDataJSON,
        "MESSAGE_PROPERTIES":MESSAGE_PROPERTIES
    };
}());

module.exports = ChatwalaMessageDocuments;

