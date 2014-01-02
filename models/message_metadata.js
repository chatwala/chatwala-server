var mongoose = require('mongoose');
var GUIDUtil = require('GUIDUtil');
var User = require('./user');

var MessageMetadataSchema = new mongoose.Schema({
    message_id:      { type: String, index: { unique: true }, required: true, default: GUIDUtil.GUID() },
    timestamp:       { type: Date, default: Date.now },
    version_id:      { type: String },
    sender_id:       { type: String, required: true },
    recipient_id:    { type: String },
    thread_id:       { type: String, required: true },
    thread_index:    { type: Number, required: true },
    start_recording: { type: Number, required: true }
});

var MessageMetadata = mongoose.model('MessageMetadata', MessageMetadataSchema);

/**
 * MessageMetadata validation
 */

// Sender validation
MessageMetadata.schema.pre("save", function(next) {
     var self = this;
     User.Model.findOne({ user_id : self.sender_id}, 'user_id', function(err, sender) {
         if (err) {
 	    next(err)
         } else if (sender) {
             next()
         } else {
//             self.invalidate("sender", "Sender must exist");
	     next(new Error("Sender does not exist"));
         }
     });
});


// Recipient validation
MessageMetadata.schema.pre("save", function(next) {
    var self = this;
    if (self.recipient_id == null || self.recipient_id == "") { return next(); }
    User.Model.findOne({ user_id : self.recipient_id }, 'user_id', function(err, recipient) {
         if (err) {
 	    next(err)
         } else if (recipient) {
             next()
         } else {
//             self.invalidate("recipient", "Recipient must exist");
	     next(new Error("Recipient does not exist"));
         }
    });
});

// MessageMetadata thumbnail method
MessageMetadata.schema.methods.thumbnail = function () {
  return 'http://chatwala-prod.azurewebsites.net/images/message_thumb.png';
}

module.exports.Schema = MessageMetadataSchema;
module.exports.Model = MessageMetadata;
