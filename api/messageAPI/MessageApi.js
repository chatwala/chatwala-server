var StartUnknownRecipientMessageSend = require("./messageAPI/StartUnknownRecipientMessageSend.js");
var CompleteUnknownRecipientMessageSend = require("./messageAPI/CompleteUnknownRecipientMessageSend.js");
var ConvertUnknownRecipientMessageToKnownRecipient = require("./messageAPI/ConvertUnknownRecipientMessageToKnownRecipient.js");
var StartReplyMessageSend = require("./messageAPI/StartReplyMessageSend.js");
var CompleteReplyMessageSend = require("./messageAPI/CompleteReplyMessageSend.js");

var MessageApi = {
    "StartUnknownRecipientMessageSend":StartUnknownRecipientMessageSend,
    "CompleteUnknownRecipientMessageSend":CompleteUnknownRecipientMessageSend,
    "ConvertUnknownRecipientMessageToKnownRecipient":ConvertUnknownRecipientMessageToKnownRecipient,
    "StartReplyMessageSend":StartReplyMessageSend,
    "CompleteReplyMessageSend": CompleteReplyMessageSend
};

module.exports = MessageApi;