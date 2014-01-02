/**
 * Module dependencies.
 */

var express = require('express');
var app = express();

var routes = require('./routes');
var messages = require('./routes/messages');
var users = require('./routes/users');

var http = require('http');
var path = require('path');
var fs = require('fs');

/**
 * BEGIN - App Configuration
 */

// Global Configuration
app.configure( function() {
    app.set('port', process.env.PORT || 1337);
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.bodyParser());
    app.use(express.json());
    app.use(express.urlencoded());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(express.multipart());
});

// Development
app.configure('development', function() {
    var expressLogFile = fs.createWriteStream('./logs/express.log', {flags: 'a'});
    app.use(express.logger({stream: expressLogFile}));
    app.use(express.errorHandler({ dumpExceptions:true, showStack: true}));
});

// Production
app.configure('production', function() {
    app.use(express.errorHandler());
    app.use(express.logger());
});

/**
 * END - App Configuration
 */


/**
 * BEGIN - App Routing
 */

app.get('/', routes.index);
app.get('/register', users.registerNewUser);
app.get('/users/:user_id/messages', messages.getUserMessages );
app.get('/messages/:message_id', messages.getMessage );
app.post('/messages', messages.submitMessageMetadata );
app.put('/messages/:message_id', messages.uploadMessage);

/**
 * END - App Routing
 */

var server = http.createServer(app);
server.listen(app.get('port'), function(){
  console.log('listening on port ' + app.get('port'));
});
