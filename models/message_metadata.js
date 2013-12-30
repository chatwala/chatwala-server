var mongoose = require('mongoose');

var MessageMetadataSchema = new mongoose.Schema({
    timestamp:       { type: Date, default: Date.now },
    version_id:      { type: String },
    sender_id:       { type: String },
    recipient_id:    { type: String },
    message_id:      {type: String },
    thread_id:       {type: String },
    thread_index:    { type: Integer },
    start_recording: { type: Float }
});
