var StartUnknownRecipientMessageSend = require("./StartUnknownRecipientMessageSend.js");
var CompleteUnknownRecipientMessageSend = require("./CompleteUnknownRecipientMessageSend.js");
var ConvertUnknownRecipientMessageToKnownRecipient = require("./ConvertUnknownRecipientMessageToKnownRecipient.js");
var StartKnownRecipientMessageSend = require("./StartKnownRecipientMessageSend.js");
var CompleteKnownRecipientMessageSend = require("./CompleteKnownRecipientMessageSend.js");

var ChatwalaApi = {
    "StartUnknownRecipientMessageSend":StartUnknownRecipientMessageSend,
    "CompleteUnknownRecipientMessageSend":CompleteUnknownRecipientMessageSend,
    "ConvertUnknownRecipientMessageToKnownRecipient":ConvertUnknownRecipientMessageToKnownRecipient,
    "StartKnownRecipientMessageSend":StartKnownRecipientMessageSend,
    "CompleteKnownRecipientMessageSend":CompleteKnownRecipientMessageSend
};

module.exports = ChatwalaApi;