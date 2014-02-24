var StartUnknownRecipientMessageSend = require("./commands/StartUnknownRecipientMessageSend.js");
var CompleteUnknownRecipientMessageSend = require("./commands/CompleteUnknownRecipientMessageSend.js");
var ConvertUnknownRecipientMessageToKnownRecipient = require("./commands/ConvertUnknownRecipientMessageToKnownRecipient.js");
var StartKnownRecipientMessageSend = require("./commands/StartKnownRecipientMessageSend.js");
var CompleteKnownRecipientMessageSend = require("./commands/CompleteKnownRecipientMessageSend.js");
var RegisterPushToken = require("./commands/RegisterPushToken.js");

var ChatwalaApi = {
    "StartUnknownRecipientMessageSend":StartUnknownRecipientMessageSend,
    "CompleteUnknownRecipientMessageSend":CompleteUnknownRecipientMessageSend,
    "ConvertUnknownRecipientMessageToKnownRecipient":ConvertUnknownRecipientMessageToKnownRecipient,
    "StartKnownRecipientMessageSend":StartKnownRecipientMessageSend,
    "RegisterPushToken":RegisterPushToken
};

module.exports = ChatwalaApi;