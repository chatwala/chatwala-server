var CreateInitialUser = require('./CreateInitialUser.js');
var RegisterPushToken = require('./RegisterPushToken.js');
var UploadUserProfilePicture = require('./UploadUserProfilePicture.js');

var UserApi = {
	"CreateInitialUser" : CreateInitialUser,
	"UploadUserProfilePicture" : UploadUserProfilePicture
};

module.exports = UserApi;