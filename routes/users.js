var MongoClient = require('mongodb').MongoClient
var format = require('util').format;
var GUIDUtil = require('GUIDUtil');
var config = require('../config.json');
var mongo_url = config["MONGO_DB"];


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
	MongoClient.connect(mongo_url, function(err,db){
		if(err) throw err;
		var collection = db.collection('users');
		collection.insert( {"user_id":user_id, inbox:[], sent:[], emails:[], devices:[] }, function(err, docs ){
			if(!err)
			{
				console.log("new user saved:",docs)
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

function updateProfile( req, res )
{
	
	// get message_id parameter
	var user_id = req.params.message_id;
	// create a temp file
	var tempFilePath = createTempFilePath();
	var file = fs.createWriteStream(tempFilePath);
	

	var fileSize = req.headers['content-length'];
	var uploadedSize = 0;
	
	console.log("storing message blob with ID:",message_id);

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
	req.on("end",function(){
		// save data to blob service with message_id
		getBlobService().createBlockBlobFromFile("profilePicture" , user_id, tempFilePath, function(error){
			if(!error){
				console.log("image stored!");
				res.send(200,[{ status:"OK"}]);
			}else{
				console.log("error",error);
			}
			// delete the temp file
			fs.unlink(tempFilePath,function(err){

			});
		});
	});
}

exports.updateProfile = updateProfile;
exports.registerNewUser = registerNewUser;
