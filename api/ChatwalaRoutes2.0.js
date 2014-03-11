var ChatwalaApi = require("./ChatwalaApi.js");
var MigrateHelper = require("./migrate/MigrateHelper.js");

/******* START UNKNOWN RECIPIENT ROUTES*************/
function postStartUnknownRecipientMessageSend(req, res) {
    var sendRequest = new ChatwalaApi.Messages.StartUnknownRecipientMessageSend.Request();
    sendRequest.message_id = req.body.message_id;
    sendRequest.sender_id = req.body.sender_id;

    ChatwalaApi.Messages.StartUnknownRecipientMessageSend.execute(sendRequest, function(err, response){
       if(!err) {
        res.send(200, response);
       }
       else {
        res.send(400, response);
       }
    });
}

function postCompleteUnknownRecipientMessageSend(req, res) {
    var sendRequest = new ChatwalaApi.Messages.CompleteUnknownRecipientMessageSend.Request();
    sendRequest.message_id = req.body.message_id;
    

    ChatwalaApi.Messages.CompleteUnknownRecipientMessageSend.execute(sendRequest, function(err, response){
        if(!err) {
            res.send(200, response);
        }
        else {
            res.send(400, response);
        }
    });
}

function postConvertUnknownRecipientMessageToKnownRecipient(req, res) {
    var convertRequest = new ChatwalaApi.Messages.ConvertUnknownRecipientMessageToKnownRecipient.Request();
    convertRequest.message_id = req.body.message_id;
    convertRequest.recipient_id = req.body.recipient_id;


    ChatwalaApi.Messages.ConvertUnknownRecipientMessageToKnownRecipient.execute(convertRequest, function(err, response){
        if(!err) {
            res.send(200, response);
        }
        else {
            res.send(400, response);
        }
    });
}

function postGetReadURLForMessage(req,res){
    var readUrlRequest = new ChatwalaApi.Messages.GetReadURLForMessage.Request();
    readUrlRequest.share_url_id = req.body.share_url_id;

    ChatwalaApi.Messages.GetReadURLForMessage.execute(readUrlRequest, function(err, response){
        if(!err){
            res.send(200, response);
        }
        else{
            res.send(400, response);
        }
    })
}

/******* END UNKNOWN RECIPIENT ROUTES*************/





/******* START KNOWN RECIPIENT ROUTES*************/
function postStartReplyMessageSend(req, res) {
    var request = new ChatwalaApi.Messages.StartReplyMessageSend.Request();
    request.replying_to_message_id = req.body.replying_to_message_id;
    request.message_id = req.body.message_id;
    request.owner_user_id = req.body.user_id;
    request.start_recording = req.body.start_recording;


    ChatwalaApi.Messages.StartReplyMessageSend.execute(request, function(err, response){
        if(!err) {
            res.send(200, response);
        }
        else {
            res.send(400, response);
        }
    });
}

function postCompleteReplyMessageSend(req, res) {
    var request = new ChatwalaApi.Messages.CompleteReplyMessageSend.Request();
    request.message_id = req.body.message_id;

    ChatwalaApi.Messages.CompleteReplyMessageSend.execute(request, function(err, response){
        if(!err) {
            res.send(200, response);
        }
        else {
            res.send(400, response);
        }
    });
}


function postRenewWriteUrlForMessage(req, res) {
    var request = new ChatwalaApi.Messages.RenewWriteSASURL.Request();
    request.share_url_id = req.body.share_url_id;
    console.log(req.body.share_url_id);
    ChatwalaApi.Messages.RenewWriteSASURL.execute(request, function(err, response){
        if(!err) {
            res.send(200, response);
        }
        else {
            res.send(400, response);
        }
    });
}

/******* END KNOWN RECIPIENT ROUTES*************/



/******** START USER ROUTES*********************/

function postGetUserInbox(req, res) {
    var request = new ChatwalaApi.Messages.GetUserInbox.Request();
    request.user_id = req.body.user_id;
    request.first_id = req.body.first_id;

    ChatwalaApi.Messages.GetUserInbox.execute(request, function(err, response){
        if(!err) {
            res.send(200, response);
        }
        else {
            res.send(400, response);
        }
    });
}


function postRegisterPushToken(req, res) {
    var request = new ChatwalaApi.Users.RegisterPushToken.Request();
    request.platform_type = req.body.platform_type;
    request.user_id = req.body.user_id;
    request.push_token = req.body.push_token;

    ChatwalaApi.Users.RegisterPushToken.execute(request, function(err, response){
        if(!err) {
            res.send(200, response);
        }
        else {
            res.send(400, response);
        }
    });
}

function postGetReadURLForUserProfilePicture(req, res){
    var request = new ChatwalaApi.Users.GetReadURLForUserProfilePicture.Request();
    request.user_id = req.body.user_id;

    ChatwalaApi.Users.GetReadURLForUserProfilePicture.execute(request, function(err, response){
        if(!err) {
            res.send(200, response);
        }
        else {
            res.send(400, response);
        }
    })
}

/*
function getThreadsForUser(req, res) {
    var request = new ChatwalaApi.GetThreadsForUser.Request();
    request.user_id = req.body.user_id;
    request.first_id = req.body.first_id;

    ChatwalaApi.GetThreadsForUser.execute(request, function(err, response){
        if(!err) {
            res.send(200, response);
        }
        else {
            res.send(500, response);
        }
    });
}

function getMessagesForThread(req, res) {
    console.log("getMessagesForThread");
    var request = new ChatwalaApi.GetMessagesForThread.Request();
    request.thread_id = req.body.thread_id;
    request.user_id = req.body.user_id;
    request.first_id = req.body.first_id;

    ChatwalaApi.Messages.GetMessagesForThread.execute(request, function(err, response){
        if(!err) {
            res.send(200, response);
        }
        else {
            res.send(500, response);
        }
    });
}
*/


function postUserProfilePicture(req, res){
    var request = new ChatwalaApi.Users.UploadUserProfilePicture.Request();
    request.user_id = req.body.user_id;

    ChatwalaApi.Users.UploadUserProfilePicture.execute(request, function(err, response){
        if(!err){
            res.send(200,response);
        }
        else{
            res.send(400, response);
        }
    })

}

function migrateMessage(req, res){
    var messageId = req.body.message_id;
    MigrateHelper.migrateSingleWala(messageId, function(err){
        if(!err){
            res.send(200,{});
        }
        else{
            res.send(400,{});
        }
    });
}




/******** END USER ROUTES***********************/
function setRoutes(app) {
    app.post("/messages/startUnknownRecipientMessageSend", postStartUnknownRecipientMessageSend);
    app.post("/messages/completeUnknownRecipientMessageSend", postCompleteUnknownRecipientMessageSend);
    app.post("/messages/addUnknownRecipientMessageToInbox", postConvertUnknownRecipientMessageToKnownRecipient);
    app.post("/messages/startReplyMessageSend", postStartReplyMessageSend);
    app.post("/messages/completeReplyMessageSend", postCompleteReplyMessageSend);
    app.post("/messages/renewWriteUrlForMessage", postRenewWriteUrlForMessage);
    app.post("/messages/userInbox", postGetUserInbox);
    app.post("/messages/postGetReadURLForMessage",postGetReadURLForMessage);
    app.post("/user/postUserProfilePicture", postUserProfilePicture);
    app.post("/user/registerPushToken", postRegisterPushToken);
    app.post("/user/postGetReadURLForUserProfilePicture", postGetReadURLForUserProfilePicture);
    app.post("/messages/migrateMessage", migrateMessage);
  //  app.post("/messages/threadsForUser", getThreadsForUser);
  //  app.post("/messages/messagesForThread", getMessagesForThread);
}

exports.setRoutes = setRoutes;