var GUIDUtil = require('GUIDUtil');

function registerNewUser( req, res )
{
	res.send(200,{user_id:GUIDUtil.GUID()} );
}



exports.registerNewUser = registerNewUser;
