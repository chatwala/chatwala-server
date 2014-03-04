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

    function getMessageReadUrl(shard_key, message_id) {
        return config.azure.blobStorageShard[shard_key].base_url + message_id;
    }

    function getWriteSharedAccessPolicy(shard_key, message_id) {

        //create a SAS that expires in 10 min
        var sharedAccessPolicy = {
            AccessPolicy: {
                Permissions: 'rw',
                Expiry: azure.date.minutesFromNow(10)
            }
        };

        return getBlobServiceForShard(shard_key).getBlobUrl("messages2", message_id, sharedAccessPolicy);
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
        "getWriteSharedAccessPolicy":getWriteSharedAccessPolicy,
        "getProfilePictureUploadURL":getProfilePictureUploadURL,
        "getThumbnailUrl":getThumbnailUrl,
        "getMessageReadUrl":getMessageReadUrl
    };

}());

module.exports=SASHelper
