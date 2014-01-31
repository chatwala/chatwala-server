/**
 * Module dependencies.
 */

console.log("Initializing node: " + new Date());
var config = require('./config.js')();

"use strict";
var express = require('express');
var users = require('./routes/users');
var messages = require('./routes/messages');
var routes = require('./routes');
var mongoClient = require('./cw_mongo.js');

var clientID = "58041de0bc854d9eb514d2f22d50ad4c";
var clientSecret = "ac168ea53c514cbab949a80bebe09a8a";

var http = require('http');
var path = require('path');

var app = express();
var queue = [];
// all environments

mongoClient.getConnection(function (err, db) {
    if (err) {
        console.log("Unable to connect to mongo DB.");
        queue.forEach(function (object) {
            object.res.send(500);
        });
    } else {
        console.log("Launching queued requests");
        queue.forEach(function (object) {
            object.next();
        });
    }

    queue = [];
});

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
    if (mongoClient.isConnected()) {
        next();
    }
    else {
        console.log("Database not connected yet, queuing request");
        queue.push({ req: req, res: res, next: next});
    }
});

app.use(function (req, res, next) {
    var authHeaderValue = "";
    var idHeaderValue = "";

    if (req.url === "/monitor") {
        // The one exception to the authorization logic
        next();
        return;
    }

    for (var item in req.headers) {

        if (item == "x-chatwala") {
            // Validate
            authHeaderValue = req.headers[item];
        }
        else if (item == "x-id") {
            idHeaderValue = req.headers[item];
        }
    }

    if (!authHeaderValue || authHeaderValue === "") {
        console.log("Authorization header is empty or not found");
        res.send(401, {error: "Not Authorized: missing headers"});
        return;
    }
    else {
        var expectedToken = clientID + ":" + clientSecret;

        if (expectedToken != authHeaderValue) {
            res.send(401, {error: "Not Authorized"});
            return;
        }
    }

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
app.get('/monitor', function (req, res) {

    // Always return success - used for monitoring
    res.send(200);

});

app.get('/', routes.index);

//Deprecated
app.get('/register', users.registerNewUser);

//Registers a push token for a user
app.post('/register', users.postPushToken);

//Registers a push token for a user
app.post('/registerPushToken', users.postPushToken);

app.get('/users/:user_id/messages', messages.getUserMessages);

//302 redirects to SASURL
app.get('/messages/:message_id', messages.getMessage);

//posts metadata and returns SASURL
app.post('/messages/:message_id', messages.postMessage);

//posts finalize on message
app.post('/messages/:message_id/finalize', messages.postFinalize);

//refresh PUT SASURL
app.get('/messages/:message_id/uploadURL', messages.getUploadURL);

//deprecated, old put message call, put directly to storage instead
app.put('/messages/:message_id', messages.putMessage);

//deprecated
app.post('/messages', messages.submitMessageMetadata);

//302 redirects to SASURL
app.get('/users/:user_id/picture', users.getProfilePicture);

//deprecated
app.put('/users/:user_id/picture', users.updateProfilePicture);

//get SASURL
app.get('/users/:user_id/pictureUploadURL', users.getProfilePictureUploadURL);

var server = http.createServer(app);

server.listen(app.get('port'), function () {
    console.log('listening on port ' + app.get('port') + " started:  ");
    console.log("Completed Node initialization: " + new Date());
});
// var serveraddress = server.address();
// console.log("serveraddress",serveraddress);
// messages.setHostname(serveraddress);
