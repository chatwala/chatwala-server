var format = require('util').format;
var GUIDUtil = require('GUIDUtil');
var utility = require('../utility');
var fs = require("fs");
var azure = require('azure');

var MongoClient = require('mongodb').MongoClient
var old_config = require('../config/prod.json');
var mongo_url = old_config["MONGO_DB"];

var config = require('../config')();

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


/**
 * GET /users/1/picture
 **/
function getProfilePicture( req, res )
{
    var uid = req.params.user_id;

    // check if user exists
    MongoClient.connect(config.db.mongodb, function(err,db){
	if(err) throw err;
	var collection = db.collection('users');
        collection.count({ user_id: uid }, function(err, count) {
	    if (err) throw err;
	    if (count == 0) {
		res.send(404, { "status": "user not found", "user_id": uid });
		return;
	    }
    
	    var newPath = utility.createTempFilePath();
	    //first agrument is the container it should prob be "profilePicture" instead of "messages"
	    utility.getBlobService().getBlobToFile("messages", uid, newPath, function(error) {
		if (!error) {
		    res.sendfile(newPath, function(err) {
			if (err) throw err;
			fs.unlink(newPath, function (err) {
			    if (err) throw err;
			});
		    });
		}
		else {
		    res.send(404, { "status": "profile picture not found", "user_id": uid });
		}
	    });
	});
    });
}

function updateProfilePicture(req, res) {
    // get user_id parameter
    var user_id = req.params.user_id;
    // create a temp file
    var tempFilePath = utility.createTempFilePath();
    var file = fs.createWriteStream(tempFilePath);

    var fileSize = req.headers['content-length'];
    var uploadedSize = 0;
    
    // handle data events
    req.on( "data",function( chunk ){
	uploadedSize += chunk.length;
	var bufferStore = file.write(chunk);
	if(bufferStore == false)
	    req.pause();
    });
    
    // handle drain events
    file.on('drain', function() {
	req.resume();
    });
    
    // handle end event
    req.on("end", function() {
	// save data to blob service with user_id
	//first agrument is the container it should prob be "profilePicture" instead of "messages"
	utility.getBlobService().createBlockBlobFromFile("messages" , user_id, tempFilePath, function(error){
	    if (!error) {
		res.send(200,[{ status:"OK"}]);
	    } else {
		res.send(400,[{ error:"need image asset"}])
	    }
	    // delete the temp file
	    fs.unlink(tempFilePath,function(err){

	    });
	});
    });
}

exports.updateProfilePicture = updateProfilePicture;
exports.getProfilePicture = getProfilePicture;
exports.registerNewUser = registerNewUser;
