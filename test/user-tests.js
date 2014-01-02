var mongoose = require('mongoose');
var config = require('../config')();

var User = require('../models/user');

describe('User', function() {
    before(function(done) {
       if (mongoose.connection.db) return done();
//       mongoose.connect('mongodb://localhost/chatwala-test', done);
       mongoose.connect(config.db.mongodb, done);
    });

    after(function(done) {
	mongoose.disconnect(done);
    });

    describe('creation', function() {
	var user = new User.Model();

	it('should create a uuid as user_id', function() {
	    user['user_id'].should.not.be.empty;
	});

	it('should be unique', function() {
	    User.Model.find({ user_id: user['user__id'] }, function(err, users) {
		users.length.should.eql(0);
	    });
	});

	it('should have an empty inbox', function() {
	    user['inbox'].should.be.empty;
	});
 
	it('should have an empty sent', function() {
	    user['sent'].should.be.empty;
	});

	it('should have an empty emails', function() {
	    user['emails'].should.be.empty;
	});

	it('should have an empty devices', function() {
	    user['devices'].should.be.empty;
	});
    });
});

