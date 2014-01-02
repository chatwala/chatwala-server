var azure = require("azure");
var fs = require("fs");
var azure = require('azure');
var uuid = require('node-uuid');
var nconf = require('nconf');
var GUIDUtil = require('GUIDUtil');
var os = require("os");
var MongoClient = require('mongodb').MongoClient
var format = require('util').format;


var blobService = null;
var old_config = require('./config/prod.json');
var account = old_config["STORAGE_NAME"];
var access_key = old_config["STORAGE_KEY"];
var host = old_config["PARTITION_KEY"];
var mongo_url = old_config["MONGO_DB"];

/**
 Lazy Creation of Blob Service

**/

function getBlobService()
{
	if(blobService == null)
	{
		blobService = azure.createBlobService(account,access_key);
		blobService.createContainerIfNotExists("messages", function(error){
		    if(!error){
				console.log("messages table ready!");
		    }else{
				console.log("failed to connect to blob service!");
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
