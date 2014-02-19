var ChatwalaApi = require("./ChatwalaApi.js");

function postStartUnknownRecipientMessageSend(req, res) {
    var sendRequest = new ChatwalaApi.StartUnknownRecipientMessageSend.Request();
    sendRequest.client_message_id = req.body.client_message_id;
    sendRequest.sender_id = req.body.sender_id;

    ChatwalaApi.StartUnknownRecipientMessageSend.execute(sendRequest, function(err, response){
       if(!err) {
        res.send(200, response.generateResponseDocument());
       }
       else {
        res.send(500, response.generateResponseDocument());
       }
    });
}

function postCompleteUnknownRecipientMessageSend(req, res) {
    var sendRequest = new ChatwalaApi.CompleteUnknownRecipientMessageSend.Request();
    sendRequest.server_message_id = req.body.server_message_id;


    ChatwalaApi.CompleteUnknownRecipientMessageSend.execute(sendRequest, function(err, response){
        if(!err) {
            res.send(200, response.generateResponseDocument());
        }
        else {
            res.send(500, response.generateResponseDocument());
        }
    });
}

function postConvertUnknownRecipientMessageToKnownRecipient(req, res) {
    var convertRequest = new ChatwalaApi.ConvertUnknownRecipientMessageToKnownRecipient.Request();
    convertRequest.server_message_id = req.body.server_message_id;
    convertRequest.recipient_id = req.body.recipient_id;


    ChatwalaApi.ConvertUnknownRecipientMessageToKnownRecipient.execute(convertRequest, function(err, response){
        if(!err) {
            res.send(200, response.generateResponseDocument());
        }
        else {
            res.send(500, response.generateResponseDocument());
        }
    });
}

function setRoutes(app) {
    app.post("/messages/startUnknownRecipientMessageSend", postStartUnknownRecipientMessageSend);
    app.post("/messages/completeUnknownRecipientMessageSend", postCompleteUnknownRecipientMessageSend);
    app.post("/messages/convertUnknownRecipientMessageToKnownRecipient", postConvertUnknownRecipientMessageToKnownRecipient);
}

exports.setRoutes = setRoutes;