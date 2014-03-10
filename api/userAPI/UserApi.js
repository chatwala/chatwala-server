var CreateInitialUser = require('./CreateInitialUser.js');
var RegisterPushToken = require('./RegisterPushToken.js');
var UploadUserProfilePicture = require('./UploadUserProfilePicture.js');
var GetReadURLForUserProfilePicture = require('./GetReadURLForUserProfilePicture.js')

var UserApi = {
	"CreateInitialUser" : CreateInitialUser,
	"UploadUserProfilePicture" : UploadUserProfilePicture,
    "GetReadURLForUserProfilePicture":GetReadURLForUserProfilePicture,
    "RegisterPushToken":RegisterPushToken
};

module.exports = UserApi;