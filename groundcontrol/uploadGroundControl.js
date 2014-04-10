
var config = require('../config.js');
var CWMongoClient = require('../cw_mongo.js');
var azure = require("azure");
var fs=require('fs');

var UploadGroundControl=(function() {

    var blobService=null;

    function initializeBlobService() {
        if (blobService == null) {
            var account = config.azure.groundControl.storage_name;
            var access_key = config.azure.groundControl.storage_key;
            blobService = azure.createBlobService(account, access_key);
        }
        return blobService;
    };

    function doIt() {
        initializeBlobService();
        blobService.createBlockBlobFromFile(config.azure.groundControl.container
            , "groundcontrol.json"
            , "groundcontrol.json"
            , function(error){
                if(error){
                    console.log(error);
                }
                else {
                    console.log("success");
                }
            })
    }

    return {
        "doIt":doIt
    }
}());

UploadGroundControl.doIt();