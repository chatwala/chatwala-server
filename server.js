
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var messages = require('./routes/messages');
var MessageList = require("./routes/messagelist");
var Message = require("./models/message");
	
var http = require('http');
var path = require('path');
var azure = require('azure');
var nconf = require('nconf');


nconf.env()
     .file({ file: 'config.json'});

var tableName = nconf.get("TABLE_NAME")
  , partitionKey = nconf.get("PARTITION_KEY")
  , accountName = nconf.get("STORAGE_NAME")
  , accountKey = nconf.get("STORAGE_KEY");


var app = express();



var msg = new Message( azure.createTableService(accountName,accountKey), tableName, partitionKey);
var msgList = new MessageList(msg);




// all environments
app.set('port', process.env.PORT || 1337);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.multipart());


// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// routing
app.get('/', routes.index);
app.get('/users', user.list);

// app.get('/messages', messages.getMessage );
// app.post('/messages', messages.submitMessage );
app.get('/messages', msgList.showMessages.bind(msgList) );
app.post('/messages', msgList.addMessage.bind(msgList) );




http.createServer(app).listen(app.get('port'), function(){
  console.log('listening on port ' + app.get('port'));
});
