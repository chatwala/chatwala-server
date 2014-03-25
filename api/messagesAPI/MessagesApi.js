var StartUnknownRecipientMessageSend = require("./StartUnknownRecipientMessageSend.js");
var CompleteUnknownRecipientMessageSend = require("./CompleteUnknownRecipientMessageSend.js");
var ConvertUnknownRecipientMessageToKnownRecipient = require("./ConvertUnknownRecipientMessageToKnownRecipient.js");
var StartReplyMessageSend = require("./StartReplyMessageSend.js");
var CompleteReplyMessageSend = require("./CompleteReplyMessageSend.js");
var GetUserInbox = require("./GetUserInbox.js");
var RenewWriteSASURL = require("./RenewWriteSASURL.js");
var GetReadURLForMessage = require("./GetReadURLForMessage.js");
var GetShareUrlFromMessageId = require("./GetShareUrlFromMessageId.js");
var GetShortUrlFromMessageId = require("./GetShortUrlFromMessageId.js");
var GetReadUrlFromShort = require("./GetReadUrlFromShort.js");

var MessagesApi = {
    "GetShareUrlFromMessageId": GetShareUrlFromMessageId,
    "GetShortUrlFromMessageId": GetShortUrlFromMessageId,
    "StartUnknownRecipientMessageSend":StartUnknownRecipientMessageSend,
    "CompleteUnknownRecipientMessageSend":CompleteUnknownRecipientMessageSend,
    "ConvertUnknownRecipientMessageToKnownRecipient":ConvertUnknownRecipientMessageToKnownRecipient,
    "StartReplyMessageSend":StartReplyMessageSend,
    "CompleteReplyMessageSend": CompleteReplyMessageSend,
    "GetUserInbox":GetUserInbox,
    "RenewWriteSASURL":RenewWriteSASURL,
    "GetReadURLForMessage":GetReadURLForMessage,
    "GetReadUrlFromShort":GetReadUrlFromShort
};

module.exports = MessagesApi;