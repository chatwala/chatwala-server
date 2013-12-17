
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var messages = require('./routes/messages');
var users = require('./routes/users');


var http = require('http');
var path = require('path');

var app = express();





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
app.get('/register', users.registerNewUser);

app.get('/messages/:message_id', messages.getMessage );
app.post('/messages', messages.submitMessageMetadata );
app.post('/messages/:message_id', messages.uploadMessage)




var server = http.createServer(app);


server.listen(app.get('port'), function(){
  console.log('listening on port ' + app.get('port'));
});
// var serveraddress = server.address();
// console.log("serveraddress",serveraddress);
// messages.setHostname(serveraddress);
