var GUIDUtil = require('GUIDUtil');

function registerNewUser( req, res )
{
	res.send(200,GUIDUtil.GUID() );
}



exports.registerNewUser = registerNewUser;
