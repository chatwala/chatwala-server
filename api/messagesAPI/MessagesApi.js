var StartUnknownRecipientMessageSend = require("./StartUnknownRecipientMessageSendWithShareId.js");
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
var GetMessageThumbnailWriteUrl = require("./GetMessageThumbnailWriteUrl.js");
var MarkMessageAsDeleted = require("./MarkMessageAsDeleted.js");
var GetMessageThumbnail = require("./GetMessageThumbnail.js");

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
    "GetReadUrlFromShort":GetReadUrlFromShort,
    "GetMessageThumbnailWriteUrl":GetMessageThumbnailWriteUrl,
    "MarkMessageAsDeleted": MarkMessageAsDeleted,
    "GetMessageThumbnail":GetMessageThumbnail
};

module.exports = MessagesApi;