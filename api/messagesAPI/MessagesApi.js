var StartUnknownRecipientMessageSend = require("./StartUnknownRecipientMessageSend.js");
var CompleteUnknownRecipientMessageSend = require("./CompleteUnknownRecipientMessageSend.js");
var ConvertUnknownRecipientMessageToKnownRecipient = require("./ConvertUnknownRecipientMessageToKnownRecipient.js");
var StartReplyMessageSend = require("./StartReplyMessageSend.js");
var CompleteReplyMessageSend = require("./CompleteReplyMessageSend.js");

var MessagesApi = {
    "StartUnknownRecipientMessageSend":StartUnknownRecipientMessageSend,
    "CompleteUnknownRecipientMessageSend":CompleteUnknownRecipientMessageSend,
    "ConvertUnknownRecipientMessageToKnownRecipient":ConvertUnknownRecipientMessageToKnownRecipient,
    "StartReplyMessageSend":StartReplyMessageSend,
    "CompleteReplyMessageSend": CompleteReplyMessageSend
};

module.exports = MessagesApi;