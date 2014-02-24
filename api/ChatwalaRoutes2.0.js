var ChatwalaApi = require("./ChatwalaApi.js");

/******* START UNKNOWN RECIPIENT ROUTES*************/
function postStartUnknownRecipientMessageSend(req, res) {
    var sendRequest = new ChatwalaApi.StartUnknownRecipientMessageSend.Request();
    sendRequest.client_message_id = req.body.client_message_id;
    sendRequest.sender_id = req.body.sender_id;

    ChatwalaApi.StartUnknownRecipientMessageSend.execute(sendRequest, function(err, response){
       if(!err) {
        res.send(200, response);
       }
       else {
        res.send(500, response);
       }
    });
}

function postCompleteUnknownRecipientMessageSend(req, res) {
    var sendRequest = new ChatwalaApi.CompleteUnknownRecipientMessageSend.Request();
    sendRequest.server_message_id = req.body.server_message_id;


    ChatwalaApi.CompleteUnknownRecipientMessageSend.execute(sendRequest, function(err, response){
        if(!err) {
            res.send(200, response);
        }
        else {
            res.send(500, response);
        }
    });
}

function postConvertUnknownRecipientMessageToKnownRecipient(req, res) {
    var convertRequest = new ChatwalaApi.ConvertUnknownRecipientMessageToKnownRecipient.Request();
    convertRequest.server_message_id = req.body.server_message_id;
    convertRequest.recipient_id = req.body.recipient_id;


    ChatwalaApi.ConvertUnknownRecipientMessageToKnownRecipient.execute(convertRequest, function(err, response){
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
    var request = new ChatwalaApi.StartKnownRecipientMessageSend.Request();
    request.replying_to_server_message_id = req.body.replying_to_server_message_id;
    request.client_message_id = req.body.client_message_id;
    request.owner_user_id = req.body.owner_user_id;


    ChatwalaApi.StartKnownRecipientMessageSend.execute(request, function(err, response){
        if(!err) {
            res.send(200, response);
        }
        else {
            res.send(500, response);
        }
    });
}

function postCompleteKnownRecipientMessageSend(req, res) {
    var request = new ChatwalaApi.CompleteKnownRecipientMessageSend.Request();
    request.server_message_id = req.body.server_message_id;

    ChatwalaApi.CompleteKnownRecipientMessageSend.execute(request, function(err, response){
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
function postRegisterPushToken(req, res) {

}

/******** END USER ROUTES***********************/



/*************START INBOX ROUTES***************/



/**************END INBOX ROUTES****************/

function setRoutes(app) {
    app.post("/messages/startUnknownRecipientMessageSend", postStartUnknownRecipientMessageSend);
    app.post("/messages/completeUnknownRecipientMessageSend", postCompleteUnknownRecipientMessageSend);
    app.post("/messages/convertUnknownRecipientMessageToKnownRecipient", postConvertUnknownRecipientMessageToKnownRecipient);
    app.post("/messages/startKnownRecipientMessageSend", postStartKnownRecipientMessageSend);
    app.post("/messages/completeKnownRecipientMessageSend", postStartKnownRecipientMessageSend);
}

exports.setRoutes = setRoutes;