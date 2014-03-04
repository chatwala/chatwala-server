var ChatwalaApi = require("./ChatwalaApi.js");

/******* START UNKNOWN RECIPIENT ROUTES*************/
function postStartUnknownRecipientMessageSend(req, res) {
    var sendRequest = new ChatwalaApi.Messages.StartUnknownRecipientMessageSend.Request();
    sendRequest.client_message_id = req.body.client_message_id;
    sendRequest.sender_id = req.body.sender_id;

    ChatwalaApi.Messages.StartUnknownRecipientMessageSend.execute(sendRequest, function(err, response){
       if(!err) {
        res.send(200, response);
       }
       else {
        res.send(500, response);
       }
    });
}

function postCompleteUnknownRecipientMessageSend(req, res) {
    var sendRequest = new ChatwalaApi.Messages.CompleteUnknownRecipientMessageSend.Request();
    sendRequest.server_message_id = req.body.server_message_id;
    

    ChatwalaApi.Messages.CompleteUnknownRecipientMessageSend.execute(sendRequest, function(err, response){
        if(!err) {
            res.send(200, response);
        }
        else {
            res.send(500, response);
        }
    });
}

function postConvertUnknownRecipientMessageToKnownRecipient(req, res) {
    var convertRequest = new ChatwalaApi.Messages.ConvertUnknownRecipientMessageToKnownRecipient.Request();
    convertRequest.server_message_id = req.body.server_message_id;
    convertRequest.recipient_id = req.body.recipient_id;


    ChatwalaApi.Messages.ConvertUnknownRecipientMessageToKnownRecipient.execute(convertRequest, function(err, response){
        if(!err) {
            res.send(200, response);
        }
        else {
            res.send(500, response);
        }
    });
}
/******* END UNKNOWN RECIPIENT ROUTES*************/





/******* START KNOWN RECIPIENT ROUTES*************/
function postStartKnownRecipientMessageSend(req, res) {
    var request = new ChatwalaApi.Messages.StartReplyMessageSend.Request();
    request.replying_to_server_message_id = req.body.replying_to_server_message_id;
    request.client_message_id = req.body.client_message_id;
    request.owner_user_id = req.body.owner_user_id;


    ChatwalaApi.Messages.StartReplyMessageSend.execute(request, function(err, response){
        if(!err) {
            res.send(200, response);
        }
        else {
            res.send(500, response);
        }
    });
}

function postCompleteKnownRecipientMessageSend(req, res) {
    var request = new ChatwalaApi.Messages.CompleteReplyMessageSend.Request();
    request.server_message_id = req.body.server_message_id;

    ChatwalaApi.Messages.CompleteReplyMessageSend.execute(request, function(err, response){
        if(!err) {
            res.send(200, response);
        }
        else {
            res.send(500, response);
        }
    });
}

/******* END KNOWN RECIPIENT ROUTES*************/



/******** START USER ROUTES*********************/
/*
function postRegisterPushToken(req, res) {
    var request = new ChatwalaApi.RegisterPushToken.Request();
    request.platform_type = req.body.platform_type;
    request.user_id = req.body.user_id;
    request.push_token = req.body.push_token;

    ChatwalaApi.Messages.RegisterPushToken.execute(request, function(err, response){
        if(!err) {
            res.send(200, response);
        }
        else {
            res.send(500, response);
        }
    });
}

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
    var request = {};//ChatwalaApi.Users.UploadUserProfilePicture.Request();
    request.user_id = req.body.user_id;

    ChatwalaApi.Users.UploadUserProfilePicture.execute(request, function(err, response){
        if(err === "success"){
            res.send(200,response);
        }
        else{
            res.send(500, response);
        }
    })

} 

function getUserProfilePicture(req, res){
    var request = {};
    request.user_id = req.body.user_id;




}

/******** END USER ROUTES***********************/
function setRoutes(app) {
    app.post("/messages/startUnknownRecipientMessageSend", postStartUnknownRecipientMessageSend);
    app.post("/messages/completeUnknownRecipientMessageSend", postCompleteUnknownRecipientMessageSend);
    app.post("/messages/convertUnknownRecipientMessageToKnownRecipient", postConvertUnknownRecipientMessageToKnownRecipient);
    app.post("/messages/startReplyMessageSend", postStartKnownRecipientMessageSend);
    app.post("/messages/completeReplyMessageSend", postCompleteKnownRecipientMessageSend);
    app.post("/user/postUserProfilePicture", postUserProfilePicture);
    //app.get("/usr/getUserProfilePicture", getUserProfilePicture);
   // app.post("/user/registerPushToken", postRegisterPushToken);
  //  app.post("/messages/threadsForUser", getThreadsForUser);
  //  app.post("/messages/messagesForThread", getMessagesForThread);
}

exports.setRoutes = setRoutes;