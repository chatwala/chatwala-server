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
        }
        return blobService;
    }



    function getBlobServiceForProfilePicture(){
        var blobService = nonShardedBlobService;
        if(blobService===undefined) {
            var account = config.azure.nonShardedBlobStorage.storage_name; //config["STORAGE_NAME"];
            var access_key = config.azure.nonShardedBlobStorage.storage_key //config["STORAGE_KEY"];

            blobService = azure.createBlobService(account,access_key);
        }
        return blobService;
    }



    function getMessageReadUrl(shard_key, message_id) {
        return config.azure.blobStorageShard[shard_key].base_url + config.azure.blobStorageShard[shard_key].container + "/" + message_id;
    }



    function getShareUrl(shard_key, message_id){
        return config.share_base_url + shard_key + "." + message_id;
    }



    function getWriteSharedAccessPolicy(shard_key, message_id) {

        //create a SAS that expires in 10 min
        var sharedAccessPolicy = {
            AccessPolicy: {
                Permissions: 'rw',
                Expiry: azure.date.minutesFromNow(10)
            }
        };

        var container_name = config.azure.blobStorageShard[shard_key].container;
        return getBlobServiceForShard(shard_key).getBlobUrl(container_name, message_id, sharedAccessPolicy);
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

    function getMessageThumbnailUrl(shard_key, message_id){
        return config.azure.blobStorageShard[shard_key].base_url + config.azure.blobStorageShard[shard_key].message_thumbnail_container + "/" + message_id;
    }

    function getMessageThumbnailWriteUrl(shard_key, message_id){

        //create a SAS that expires in 10 min
        var sharedAccessPolicy = {
            AccessPolicy: {
                Permissions: 'rw',
                Expiry: azure.date.minutesFromNow(10)
            }
        };

        var container_name = config.azure.blobStorageShard[shard_key].message_thumbnail_container;
        return getBlobServiceForShard(shard_key).getBlobUrl(container_name, message_id, sharedAccessPolicy);

    }

    return {
        "getCurrentShardKey":getCurrentShardKey,
        "getWriteSharedAccessPolicy":getWriteSharedAccessPolicy,
        "getProfilePictureUploadURL":getProfilePictureUploadURL,
        "getThumbnailUrl":getThumbnailUrl,
        "getMessageReadUrl":getMessageReadUrl,
        "getShareUrl":getShareUrl,
        "getMessageThumbnailWriteUrl":getMessageThumbnailWriteUrl,
        "getMessageThumbnailUrl":getMessageThumbnailUrl
    };

}());

module.exports=SASHelper
