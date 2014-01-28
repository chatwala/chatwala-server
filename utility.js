var azure = require("azure");
var fs = require("fs");
var uuid = require('node-uuid');
var GUIDUtil = require('GUIDUtil');
var os = require("os");

var blobService = null;
var config = require('./config.js')();
var account = config.azure.storage_name; //config["STORAGE_NAME"];
var access_key = config.azure.storage_key //config["STORAGE_KEY"];
//var host = config["PARTITION_KEY"];
//var mongo_url = config.db.mongodb // config["MONGO_DB"];
/**
 Lazy Creation of Blob Service

**/

function getBlobService()
{
        if(blobService == null) {

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

function createTempFilePath()
{
        var tempFileName =  GUIDUtil.GUID();
        return __dirname + "/temp/"+tempFileName;
}

exports.createTempFilePath = createTempFilePath;
exports.getBlobService = getBlobService;