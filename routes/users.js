var format = require('util').format;
var GUIDUtil = require('GUIDUtil');
var utility = require('../utility');
var fs = require("fs");
var azure = require('azure');

var MongoClient = require('mongodb').MongoClient
var config = require('../config')();
var mongo_url = config.db.mongodb;

var BlobService = require('../blob_service');

/**
 * GET  /register
 * POST /register
 **/
function registerNewUser( req, res )
{
    var user_id = GUIDUtil.GUID();
    saveNewUser(user_id, function(err,results){
	if(err) throw err;
	res.send(200,results);
    });
    
}

function saveNewUser(user_id, callback)
{
    MongoClient.connect(config.db.mongodb, function(err,db){
	if(err) throw err;
	var collection = db.collection('users');
	collection.insert( {"user_id":user_id, inbox:[], sent:[], emails:[], devices:[] }, function(err, docs ){
	    if(!err)
	    {
		callback(null,docs);
		db.close();
	    }else{
		// error
		callback(err);
		db.close();
	    }		
	});
    });
}


function _validateUser(uid, callback) {
    MongoClient.connect(config.db.mongodb, function(err,db){
	if(err) throw err;
	var collection = db.collection('users');
        collection.count({ user_id: uid }, function(err, count) {
	    callback(err, (count == 1));
	});
    });
}


/**
 * GET /users/1/picture
 **/
function getProfilePicture( req, res )
{
    var uid = req.params.user_id;
    _validateUser(uid, function(err, exists) {
	if (err) throw err;
	if (!exists) {
	    res.send(404, { "status": "user not found", "user_id": uid });
	    return;
	}
    
	var newPath = utility.createTempFilePath() + ".png";
	//first agrument is the container it should prob be "profilePicture" instead of "messages"
	BlobService.getBlobService().getBlobToStream('messages', uid, res, function(err) {
	    if (err) {
		res.send(404, { "status": "profile picture not found", "user_id": uid });
		return;
	    }
	    res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
	    res.end();
	});
    });
}

function updateProfilePicture(req, res) {
    // get user_id parameter
    var uid = req.params.user_id;
    _validateUser(uid, function(err, exists) {
	if (err) throw err;
	if (!exists) {
	    res.send(404, { "status": "user not found", "user_id": uid });
	    return;
	}

	// create a temp file
	var tempFilePath = utility.createTempFilePath();
	var file = fs.createWriteStream(tempFilePath);

	var fileSize = req.headers['content-length'];
	var uploadedSize = 0;
    
	// handle data events
	req.on('data', function(chunk) {
	    uploadedSize += chunk.length;
	    var bufferStore = file.write(chunk);
	    if (bufferStore == false)
		req.pause();
	});
    
	// handle drain events
	file.on('drain', function() {
	    req.resume();
	});
    
	// handle end event
	req.on('end', function() {
	    // save data to blob service with user_id
	    // make sure the uploadedSize == fileSize
	    if (fileSize != uploadedSize) {
		res.send(404, { error: "upload error" });
		return;
	    }
		
	    //first agrument is the container it should prob be "profilePicture" instead of "messages"
	    BlobService.getBlobService().createBlockBlobFromFile('messages', uid, tempFilePath, function(err) {
		if (err) {
		    res.send(404, { error: "error saving profile image" });
		    return;
		}
		res.send(200, { status: "OK" });
	    	// delete the temp file
	    	fs.unlink(tempFilePath, function(err) {
		    if (err) { console.log(err); }
		});
	    });
	});
    });
}

exports.updateProfilePicture = updateProfilePicture;
exports.getProfilePicture = getProfilePicture;
exports.registerNewUser = registerNewUser;
