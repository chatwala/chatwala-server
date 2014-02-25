var StartUnknownRecipientMessageSend = require("./commands/StartUnknownRecipientMessageSend.js");
var CompleteUnknownRecipientMessageSend = require("./commands/CompleteUnknownRecipientMessageSend.js");
var ConvertUnknownRecipientMessageToKnownRecipient = require("./commands/ConvertUnknownRecipientMessageToKnownRecipient.js");
var StartReplyMessageSend = require("./commands/StartReplyMessageSend.js");
var CompleteReplyMessageSend = require("./commands/CompleteReplyMessageSend.js");
var RegisterPushToken = require("./commands/RegisterPushToken.js");
var GetThreadsForUser = require("./commands/GetThreadsForUser.js");
var GetMessagesForThread = require("./commands/GetMessagesForThread.js");

var ChatwalaApi = {
    "StartUnknownRecipientMessageSend":StartUnknownRecipientMessageSend,
    "CompleteUnknownRecipientMessageSend":CompleteUnknownRecipientMessageSend,
    "ConvertUnknownRecipientMessageToKnownRecipient":ConvertUnknownRecipientMessageToKnownRecipient,
    "StartReplyMessageSend":StartReplyMessageSend,
    "CompleteReplyMessageSend": CompleteReplyMessageSend,
    "RegisterPushToken":RegisterPushToken,
    "GetThreadsForUser": GetThreadsForUser,
    "GetMessagesForThread":GetMessagesForThread
};

module.exports = ChatwalaApi;