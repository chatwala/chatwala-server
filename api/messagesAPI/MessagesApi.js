var StartUnknownRecipientMessageSend = require("./StartUnknownRecipientMessageSend.js");
var CompleteUnknownRecipientMessageSend = require("./CompleteUnknownRecipientMessageSend.js");
var ConvertUnknownRecipientMessageToKnownRecipient = require("./ConvertUnknownRecipientMessageToKnownRecipient.js");
var StartReplyMessageSend = require("./StartReplyMessageSend.js");
var CompleteReplyMessageSend = require("./CompleteReplyMessageSend.js");
var GetUserInbox = require("./GetUserInbox.js");
var RenewWriteSASURL = require("./RenewWriteSASURL.js");

var MessagesApi = {
    "StartUnknownRecipientMessageSend":StartUnknownRecipientMessageSend,
    "CompleteUnknownRecipientMessageSend":CompleteUnknownRecipientMessageSend,
    "ConvertUnknownRecipientMessageToKnownRecipient":ConvertUnknownRecipientMessageToKnownRecipient,
    "StartReplyMessageSend":StartReplyMessageSend,
    "CompleteReplyMessageSend": CompleteReplyMessageSend,
    "GetUserInbox":GetUserInbox,
    "RenewWriteSASURL":RenewWriteSASURL,
};

module.exports = MessagesApi;