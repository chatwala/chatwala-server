UnknownRecipientMessageSend= {
    responseCodes: {
      "success":"A document for {{message_id}} has been successfully added to the messages collection."
    },
    Request: function() {
        this.sender_id=null;
        this.message_id=null;

        this.execute= function(callback) {
           //create starter message document

        }
    },
    Response: function() {
        this.message_meta_data=null;
        this.responseCode=null;
    }
};

exports.$ = UnknownRecipientMessageSend;


