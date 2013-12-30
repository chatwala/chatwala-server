var should = require('should');
var request = require('supertest');

var GUIDUtil = require('GUIDUtil');
var target = require('../routes/users.js');

describe('Users', function() {
    var request;
    var response;

    // before(function(done) {
    // 	request = {};
    // 	response = {
    // 	    code: 0,
    // 	    data: {},
    // 	    send: function(code, results) {
    // 		this.code = code;
    // 		this.data = results;
    // 	    }
    // 	};
    // 	done();
    // });

    // describe('registerNewUser', function() {
    // 	var mock_code = 100;
    // 	var mock_guid = "MOCK_GUID";

    // 	before(function(done) {
    // 	    GUIDUtil.GUID = function() { return; }
    // 	    target.saveNewUser = function(user_id, callback) { return; }
    // 	    done();
    // 	});

    //     it('should create a new UUID for the user', function(done) {
    // 	    var callback = function(err, result) {
    // 		response.send(mock_code, { user_id: mock_guid });
    // 	    };
    // 	    target.saveNewUser = function(user_id, callback) {
    // 		callback(NULL, user_id);
    // 	    }
    // 	    target.registerNewUser(request, response);
    // 	});

    // 	it('should save the new user', function(done) {
    // 	});
    // });
});
