var azure = require('azure')
  , uuid = require('node-uuid');


module.exports = Message;

function Message( storageClient, tableName, partitionKey )
{
	this.storageClient	= storageClient;
	this.tableName		= tableName;
	this.partitionKey	= partitionKey;
	
	this.storageClient.createTableIfNotExists(tableName, function tableCreated(err){
		if (err) throw err;
	});
}



Message.prototype = {
	find: function( query, callback )
	{
		var self = this;
		self.storageClient.queryEntities( query, function entitiesQueried(err, entities){
			if(err) callback(err);
			callback(null,entities);
		});
	},
	
	addItem: function( item, callback )
	{
		var self = this;
		item.RowKey = uuid();
		item.PartitionKey = self.partitionKey;
		self.storageClient.insertEntity( self.tableName, item, function entityInserted(err){
			if(err) callback(err);
			callback(null);
		});
	},
	
	updateItem: function( item, callback )
	{
		var self = this;
		self.storageClient.queryEntity( self.tableName, self.partitionKey, item, function entityQueried( err, entity ){
			if (err) throw err;
			self.storageClient.updateEntity( self.tableName, entity, function entityUpdated(err){
				if (err) throw err;
				callback(null);
			});
		});
	}
	
}



