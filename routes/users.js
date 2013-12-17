var MongoClient = require('mongodb').MongoClient
var format = require('util').format;
var GUIDUtil = require('GUIDUtil');
var mongo_url = "mongodb://chatwala_mongo:CbvTA5.gkm.N9DJhYtWgKy1HRQZRGB_4mAftidt4wkA-@ds035787.mongolab.com:35787/chatwala_mongo";



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
