
/**
 * Module dependencies.
 */
"use strict"; 
var express = require('express');
var routes = require('./routes');
var messages = require('./routes/messages');
var users = require('./routes/users');

var clientID = "58041de0bc854d9eb514d2f22d50ad4c";
var clientSecret = "ac168ea53c514cbab949a80bebe09a8a";

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

app.use(function (req, res, next) {
	
	console.log('Received request - authenticating');
	var authHeaderValue = "";
	var idHeaderValue = "";
	
	for(var item in req.headers) {
	
		if (item == "x-chatwala") {
			// Validate			
			authHeaderValue = req.headers[item];
		}
		else if (item == "x-id") {
			idHeaderValue = req.headers[item];
		}
  	}
	
	if (!authHeaderValue || authHeaderValue === "") {
		console.log ("Authorization header is empty or not found");
		res.send(401, {error:"Not Authorized: missing headers"});
		return;
	}
	else {
		var expectedToken = clientID + ":" + clientSecret;
		
		if (expectedToken != authHeaderValue) {
			res.send(401, {error:"Not Authorized"});
			return;
		}
	}
	
    console.log ("Request authenticated!");
	next();
});

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
app.get('/users/:user_id/messages', messages.getUserMessages );
//app.get('/users/:user_id/messages/:message_id', messages.getMessage );
app.get('/messages/:message_id', messages.getMessage );
app.post('/messages', messages.submitMessageMetadata );
app.put('/messages/:message_id', messages.uploadMessage);
app.get('/users/:user_id/picture', users.getProfilePicture)
app.put('/users/:user_id/picture', users.updateProfilePicture)





var server = http.createServer(app);


server.listen(app.get('port'), function(){
  console.log('listening on port ' + app.get('port'));
});
// var serveraddress = server.address();
// console.log("serveraddress",serveraddress);
// messages.setHostname(serveraddress);
