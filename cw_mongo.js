var MongoClient = require('mongodb').MongoClient;
var config = require('./config.js');
var mongo_url = config.db.mongodb;
var azure = null;
var mongoDatabase;

function getConnection(callback) {
        
        if (mongoDatabase) {
                callback(null,mongoDatabase);
        }
        else {
                console.log("Connecting to mongo database...");
                
                MongoClient.connect(mongo_url, function(err,db) {
                        if(err) {
                                console.log("Unable to connect to Mongo database.");
                                mongoDatabase = null;
                                callback(err, null);
                        }
                        else {
                                console.log("Connected to Mongo database.");
                                mongoDatabase = db;
                                callback(null, mongoDatabase);
                        }
                });
        }
};

function isConnected() {
        if (mongoDatabase === undefined) {
                return false;
        }
        else {
                return true;
        }
}

module.exports.getConnection = getConnection;
module.exports.isConnected = isConnected;