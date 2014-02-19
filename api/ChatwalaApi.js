var StartUnknownRecipientMessageSend = require("./StartUnknownRecipientMessageSend.js");
var CompleteUnknownRecipientMessageSend = require("./CompleteUnknownRecipientMessageSend.js");
var ConvertUnknownRecipientMessageToKnownRecipient = require("./ConvertUnknownRecipientMessageToKnownRecipient.js");
var StartKnownRecipientMessageSend = require("./StartKnownRecipientMessageSend.js");

var ChatwalaApi = {
    "StartUnknownRecipientMessageSend":StartUnknownRecipientMessageSend,
    "CompleteUnknownRecipientMessageSend":CompleteUnknownRecipientMessageSend,
    "ConvertUnknownRecipientMessageToKnownRecipient":ConvertUnknownRecipientMessageToKnownRecipient,
    "StartKnownRecipientMessageSend":StartKnownRecipientMessageSend
};

module.exports = ChatwalaApi;