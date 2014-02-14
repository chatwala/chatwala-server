var UnkownRecipientMessageSend = require("UnknownRecipientMessageSend");

var ChatwalaApi = {

    requests: {
        "unknownRecipientMessageSendRequest": UnkownRecipientMessageSend.cwRequest
    },

    responses: {
        "unknownRecipientMessageSendResponse": UnkownRecipientMessageSend.cwResponse
    }
};
exports.$ = ChatwalaApi;