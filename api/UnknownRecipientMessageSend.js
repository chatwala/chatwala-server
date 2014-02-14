UnknownRecipientMessageSend= {
    responseCodes: {
      "200":"success"
    },
    request: function() {
        this.sender_id=null;
        this.message_id=null;

        this.execute= function(callback) {
           //create starter message document
           //
        }
    },
    response: function() {
        this.message_meta_data=null;
        this.responseCode=null;
    }
};

exports.$ = UnknownRecipientMessageSend;


