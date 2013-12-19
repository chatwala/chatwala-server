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




exports.registerNewUser = registerNewUser;
