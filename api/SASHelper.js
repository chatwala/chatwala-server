var azure = require("azure");
var config = require('../config.js');

var SASHelper=(function() {
    var blobServices={};
    var nonShardedBlobService=undefined;

    function getCurrentShardKey() {
        return config.azure.currentShardKey;
    }

    function getBlobServiceForShard(shardKey)
    {

        var blobService = blobServices[shardKey];
        if(blobService===undefined) {
            var account = config.azure.blobStorageShard[shardKey].storage_name; //config["STORAGE_NAME"];
            var access_key = config.azure.blobStorageShard[shardKey].storage_key //config["STORAGE_KEY"];

            blobService = azure.createBlobService(account,access_key);
            blobService.createContainerIfNotExists("messages", function(error) {
                if(!error) {
                }
                else{
                    console.log("failed to connect to blob service: " + error);
                    blobService = null;
                }
            });

            blobService.createContainerIfNotExists("pictures", function(error) {
                if(!error) {
                }
                else {
                    console.log("failed to connect to blob service: " + error);
                    blobService = null;
                }
            });
        }
        return blobService;
    }

    function getBlobServiceForProfilePicture(){
        var blobService = nonShardedBlobService;
        if(blobService===undefined) {
            var account = config.azure.nonShardedBlobStorage.storage_name; //config["STORAGE_NAME"];
            var access_key = config.azure.nonShardedBlobStorage.storage_key //config["STORAGE_KEY"];

            blobService = azure.createBlobService(account,access_key);
            blobService.createContainerIfNotExists(config.azure.nonShardedBlobStorage.container, function(error) {
                if(!error) {

                }
                else{
                    console.log("failed to connect to blob service: " + error);
                    blobService = null;
                }
            });
        }
        return blobService;
    }

    function getShardKeyFromServerMessageId(server_message_id) {
        var split = server_message_id.split(".");
        return split[0];
    }

    function getMessageReadUrl(message_id) {
        var current_shard_key = config.azure.currentShardKey;
        return config.azure.blobStorageShard[current_shard_key].base_url + message_id;
    }

    function getReadSharedAccessPolicy(server_message_id) {

        //create a SAS that expires in 10 thousand years
        var sharedAccessPolicy = {
            AccessPolicy: {
                Permissions: 'r',
                Expiry:azure.date.minutesFromNow(60*24*365*100)
            }
        };

        return getBlobServiceForShard(getShardKeyFromServerMessageId(server_message_id)).getBlobUrl("messages", server_message_id, sharedAccessPolicy);
    }

    function getWriteSharedAccessPolicy(server_message_id) {

        //create a SAS that expires in 10 min
        var sharedAccessPolicy = {
            AccessPolicy: {
                Permissions: 'rw',
                Expiry: azure.date.minutesFromNow(10)
            }
        };

        return getBlobServiceForShard(getShardKeyFromServerMessageId(server_message_id)).getBlobUrl("messages", server_message_id, sharedAccessPolicy);
    }

    function getWriteSharedAccessPolicyForProfilePicture(user_id) {
        //create a SAS that expires in 10 min
        var sharedAccessPolicy = {
            AccessPolicy: {
                Permissions: 'rw',
                Expiry: azure.date.minutesFromNow(10)
            }
        };    
        return getBlobServiceForProfilePicture().getBlobUrl(config.azure.nonShardedBlobStorage.container, user_id, sharedAccessPolicy);
    }


    function getProfilePictureUploadURL(user_id) {
        return getWriteSharedAccessPolicyForProfilePicture(user_id);
    }

    function getThumbnailUrl(sender_user_id) {
        return config.azure.nonShardedBlobStorage.base_url + sender_user_id;
    }

    return {
        "getCurrentShardKey":getCurrentShardKey,
        "getReadSharedAccessPolicy":getReadSharedAccessPolicy,
        "getWriteSharedAccessPolicy":getWriteSharedAccessPolicy,
        "getProfilePictureUploadURL":getProfilePictureUploadURL,
        "getThumbnailUrl":getThumbnailUrl,
        "getMessageReadUrl":getMessageReadUrl
    };

}());

module.exports=SASHelper
