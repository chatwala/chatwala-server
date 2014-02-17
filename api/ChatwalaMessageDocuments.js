var ChatwalaMessageDocuments=(function() {

    function createStarterUnknownRecipientMessageDocument(startUnknownRecipientMessageSendRequest) {
        var request = startUnknownRecipientMessageSendRequest;
        return {
            "message_instance_id": request.sender_id + "." + request.message_id,
            "message_id": request.message_id,
            "owner_user_id": request.sender_id,
            "owner_role": "sender",
            "other_user_id": "unknown_recipient",
            "other_role": "recipient",
            "sender_id":request.sender_id,
            "recipient_id":"unknown_recipient",
            "thread_id": null,
            "thread_count":0,
            "replying_to_message_id": null,
            "blob_storage_shard_key":1,
            "unknown_recipient_starter": true,
            "uploaded":false,
            "received":false,
            "replied": false,
            "replied_message_id":null,
            "showable":false,
            "timestamp":Math.round((new Date()).getTime() / 1000),
            "decryptionKey": null
        };
    }

    function createKnownRecipientMessageDocumentForSender(convertUnknownRecipientMessageToKnownRecipientRequest) {
        return {
            "message_instance_id": request.sender_id + "." + request.message_id,
            "message_id": request.message_id,
            "owner_user_id": request.sender_id,
            "owner_role": "sender",
            "other_user_id": request.recipient_id,
            "other_role": "recipient",
            "sender_id":request.sender_id,
            "recipient_id": request.recipient_id,
            "thread_id": request.message_id + "." + request.sender_id + "." + request.recipient_id,
            "thread_count":0,
            "replying_to_message_id": null,
            "blob_storage_shard_key":1,
            "unknown_recipient_starter": false,
            "uploaded":true,
            "received":true,
            "replied": false,
            "replied_message_id":null,
            "showable":true,
            "timestamp":originalTimestamp
        };
    }

    function createKnownRecipientMessageDocumentForSenderForRecipient(convertUnknownRecipientMessageToKnownRecipientRequest) {

    }

    return {
        "createStarterUnknownRecipientMessageDocument": createStarterUnknownRecipientMessageDocument,
        "createKnownRecipientMessageDocument": createKnownRecipientMessageDocument,
        "createSenderMessageDocument": createSenderMessageDocument
    };
});

exports = ChatwalaMessageDocuments;

