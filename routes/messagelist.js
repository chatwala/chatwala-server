var azure = require('azure')
  , async = require('async');

module.exports = MessageList;

function MessageList( message )
{
	this.message = message;
}


MessageList.prototype = {
	
	
	showMessages: function(req, res )
	{
		var self = this;
		var query = azure.TableQuery
			.select()
			.from(self.task.tableName);
		self.task.find(query, function itemsFound(err, items){
			res.send(200,items);
		});
	},
	
	addMessage: function( req, res )
	{
		
		
		var self = this;
		var item = req.body;
		self.message.addItem(item, function itemAdded( err ){
			if( err ) throw err;
			res.send(200,"OK");
			
		});
	},
	
	
	getMessage: function( req, res )
	{
		
	}
	
};


