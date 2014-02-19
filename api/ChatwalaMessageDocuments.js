var GUIDUtil = require('GUIDUtil');

var ChatwalaMessageDocuments=(function() {

    var ROLE_SENDER = "SENDER";
    var ROLE_RECIPIENT = "RECIPIENT";
    var RECIPIENT_UNKNOWN = "RECIPIENT_UNKNOWN";

    function Message() {

        this.getTemplate = function() {
            return {
                "message_instance_id": undefined, //blob_storage_shard_key.client_message_id.owner_id
                "client_message_id": undefined,   //defined by client, not really used
                "server_message_id": undefined,  //blob_storage_shard_key.client_message_id
                "owner_user_id": undefined,
                "owner_role": undefined,
                "other_user_id": undefined,
                "other_user_role": undefined,
                "sender_id": undefined,
                "recipient_id": undefined,
                "group_id":undefined,
                "thread_id": undefined,
                "thread_count":undefined,
                "blob_storage_shard_key":undefined,
                "unknown_recipient_starter": undefined,
                "uploaded":false,
                "delivered":false,
                "viewed":false,
                "replied": false,
                "replied_by_server_message_id":null,
                "replying_to_server_message_id":null,
                "showable":false,
                "timestamp":undefined, //since epoch
                "decryption_key":null
            };
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
            if(this.properties["client_message_id"]===undefined || this.properties["blob_storage_shard_key"]===undefined) {
                throw "client_message_id and blob_storage_shard_key must be defined";
            }
            this.properties["server_message_id"] = this.properties["blob_storage_shard_key"] + "." + this.properties["client_message_id"];

        }

        this.generateMessageInstanceId=function() {
            if(this.properties["unknown_recipient_starter"]===undefined || this.properties["server_message_id"]===undefined || this.properties["owner_user_id"]===undefined) {
                throw "unknown_recipient_starter, server_message_id and owner_user_id must be defined";
            }

            this.properties["message_instance_id"] = this.properties["server_message_id"] + "." + this.properties["owner_user_id"] + (this.properties["unknown_recipient_starter"]===true ? ".UNKNOWN_RECIPIENT_STARTER": "");
        }

        this.generateThreadInformation=function() {
            if(this.properties["server_message_id"]===undefined || this.properties["sender_id"]===undefined || this.properties["recipient_id"]===undefined ) {
                throw "server_message_id, sender_id and recipient_id must be defined"
            }

            this.properties["thread_id"] = this.properties["server_message_id"] + "." + this.properties["sender_id"] + "." + this.properties["recipient_id"];
            this.properties["thread_count"] = 0;
        }

        this.generateGroupId=function() {
            this.properties["group_id"] = GUIDUtil.GUID();
        }

        this.generateBlobShardKey=function() {
            this.properties["blob_storage_shard_key"] = 1;
        }

        this.generateTimeStamp= function() {
            this.properties["timestamp"]=(new Date()).getTime();
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
               console.log("property=" + property);
               if(this.properties[property]===undefined) {
                   console.log("undefined found");
                   return false;
               }
           }
            console.log("isValid returned");
           return true;
        }


    }

    function createMetaDataJSON(properties, blnIncludeDecryptionKey) {
        var message = new Message();

        var metaDataJSON = message.getTemplate();

        for(var property in metaDataJSON) {
            metaDataJSON[property] = properties[property];
        }

        if(blnIncludeDecryptionKey===false) {
            delete metaDataJSON["decryption_key"];
        }

        console.log("start deleteing unneeded");
        delete metaDataJSON["owner_user_id"];
        delete metaDataJSON["owner_role"];
        delete metaDataJSON["other_user_id"];
        delete metaDataJSON["other_user_role"];
        delete metaDataJSON["showable"];
        delete metaDataJSON["blob_storage_shard_key"];
        console.log("end deleteing unneeded");

        return metaDataJSON;
    }

    function createNewStarterUnknownRecipientMessage(client_message_id, sender_id) {

        console.log("client_message_id=" + client_message_id + " sender_id =" + sender_id);
        var message = new Message();
        message.setPropsFromDictionary({
            "client_message_id": client_message_id,
            "owner_user_id": sender_id,
            "owner_role": ROLE_SENDER,
            "other_user_id": RECIPIENT_UNKNOWN,
            "other_user_role":ROLE_RECIPIENT,
            "recipient_id": RECIPIENT_UNKNOWN,
            "sender_id": sender_id,
            "unknown_recipient_starter": true
        });

        console.log("message=");

        try {
            message.generateBlobShardKey();
            message.generateServerMessageId();
            message.generateMessageInstanceId();
            message.generateThreadInformation();
            message.generateGroupId();
            message.generateTimeStamp();
            console.log(message.properties);
            return message;
        }
        catch(e) {
            console.log(e);
            return null;
        }

    }

    function createNewKnownRecipientMessage(client_message_id, sender_id, replying_to_server_message_id) {
        var message = new Message();
        message.setPropsFromDictionary({
            "client_message_id": client_message_id,
            "recipient_id": recipient_id,
            "sender_id": sender_id,
            "replying_to_server_message_id": replying_to_server_message_id,
            "thread_id": thread_id,
            "thread_count": thread_count,
            "group_id": group_id
        });

        return message;
    }


    return {
        "Message": Message,
        "ROLE_SENDER": ROLE_SENDER,
        "ROLE_RECIPIENT": ROLE_RECIPIENT,
        "RECIPIENT_UNKNOWN":RECIPIENT_UNKNOWN,
        "createNewStarterUnknownRecipientMessage": createNewStarterUnknownRecipientMessage,
        "createNewKnownRecipientMessage": createNewKnownRecipientMessage,
        "createMetaDataJSON": createMetaDataJSON
    };
}());

module.exports = ChatwalaMessageDocuments;

