var mongoose = require('mongoose');
var GUIDUtil = require('GUIDUtil');

var UserSchema = new mongoose.Schema({
    user_id: { type: String, index: { unique: true }, required: true, default: GUIDUtil.GUID() },
    inbox:   [],
    sent:    [],
    emails:  [],
    devices: []
});

var User = mongoose.model('User', UserSchema);

module.exports.Schema = UserSchema;
module.exports.Model = User;
