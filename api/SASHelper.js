var azure = require("azure");
var config = require('../config.js');

var SASHelper=(function() {
    var blobServices={};

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

    function getShardKeyFromServerMessageId(server_message_id) {
        var split = server_message_id.split(".");
        return split[0];
    }

    function getReadSharedAccessPolicy(server_message_id) {

        //create a SAS that expires in an hour
        var sharedAccessPolicy = {
            AccessPolicy: {
                Permissions: 'r'
            }
        };

        return getBlobServiceForShard(getShardKeyFromServerMessageId(server_message_id)).getBlobUrl("messages", server_message_id, sharedAccessPolicy);
    }

    function getWriteSharedAccessPolicy(server_message_id) {

        //create a SAS that expires in an hour
        var sharedAccessPolicy = {
            AccessPolicy: {
                Permissions: 'rw',
                Expiry: azure.date.minutesFromNow(10)
            }
        };

        return getBlobServiceForShard(getShardKeyFromServerMessageId(server_message_id)).getBlobUrl("messages", server_message_id, sharedAccessPolicy);
    }


    return {
        "getCurrentShardKey":getCurrentShardKey,
        "getReadSharedAccessPolicy":getReadSharedAccessPolicy,
        "getWriteSharedAccessPolicy":getWriteSharedAccessPolicy
    };

}());

module.exports=SASHelper
