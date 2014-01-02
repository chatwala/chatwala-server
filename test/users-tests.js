var should = require('should');
var request = require('supertest');

var GUIDUtil = require('GUIDUtil');
var mongoose = require('mongoose');
var config = require('../config')();
var User = require('../models/user.js');

var target = require('../routes/users.js');

describe('Users', function() {
    var url = 'http://localhost:1337';

    before(function(done) {
	if (mongoose.connection.db) return done();
	mongoose.connect(config.db.mongodb, done);
    });

    // after(function(done) {
    // 	mongoose.disconnect(done);
    // });

    describe ('GET /register', function() {
	it('should respond with json', function(done) {
	    request(url)
		.get('/register')
		.set('Accept', 'application/json')
		.expect(200)
		.end(function(err, res) {
		    if (err) return done(err);
		    done()
		});
	});

	it('should return an array with one element', function(done) {
	    request(url)
		.get('/register')
		.set('Accept', 'application/json')
		.end(function(err, res) {
		    if (err) return done(err);
		    res.body.should.be.instanceof(Array);
		    res.body.length.should.equal(1);
		    done();
		});
	});

	it('should have one element that is a user (mongo) json', function(done) {
	    request(url)
		.get('/register')
		.set('Accept', 'application/json')
		.end(function(err, res){
		    if (err) return done(err);
		    elem = res.body[0];
		    elem.should.have.property('_id');
	            elem.should.have.property('user_id');
	            elem.should.have.property('inbox');
	            elem.should.have.property('sent');
	            elem.should.have.property('emails');
	            elem.should.have.property('devices');
		    done()
		});
	});
    });

    describe ('POST /register', function() {
	it('should respond with json', function(done) {
	    request(url)
		.post('/register')
		.set('Accept', 'application/json')
		.expect(200)
		.end(function(err, res) {
		    if (err) return done(err);
		    done()
		});
	});

	it('should return an array with one element', function(done) {
	    request(url)
		.post('/register')
		.set('Accept', 'application/json')
		.end(function(err, res) {
		    if (err) return done(err);
		    res.body.should.be.instanceof(Array);
		    res.body.length.should.equal(1);
		    done();
		});
	});

	it('should have one element that is a user (mongo) json', function(done) {
	    request(url)
		.post('/register')
		.set('Accept', 'application/json')
		.end(function(err, res){
		    if (err) return done(err);
		    elem = res.body[0];
		    elem.should.have.property('_id');
	            elem.should.have.property('user_id');
	            elem.should.have.property('inbox');
	            elem.should.have.property('sent');
	            elem.should.have.property('emails');
	            elem.should.have.property('devices');
		    done()
		});
	});
    });

    describe('GET /users/1/picture', function() {
	describe('no valid user', function() {
	    it('should return a 404', function(done) {
		var user_id = GUIDUtil.GUID();
		request(url)
		    .get('/users/' + user_id + '/picture')
		    .set('Accept', 'application/json')
		    .expect(404)
		    .end(function(err, res) {
			if (err) return done(err);
			done();
		    });
	    });

	    it('should return a json error', function(done) {
	    	var user_id = GUIDUtil.GUID();
	    	request(url)
	    	    .get('/users/' + user_id + '/picture')
	    	    .set('Accept', 'application/json')
	    	    .end(function(err, res) {
	    		if (err) return done(err);
	    		res.body.should.have.property('status');
	    		res.body.status.should.equal('user not found');
	    		res.body.should.have.property('user_id');
	    		done();
	    	    });
	    });
	})

    	describe('valid user', function() {
    	    var user = new User.Model();
    	    before(function(done) {
    		user.save();
    		done();
    	    });

    	    describe('no profile picture', function() {
    		it('should return a 404', function(done) {
    		    request(url)
    			.get('/users/' + user.user_id + '/picture')
    			.set('Accept', 'application/json')
    			.expect(404)
    			.end(function(err, res) {
    			    if (err) return done(err);
    			    done();
    			});
    		});

    		it('should return a json error', function(done) {
    		    request(url)
    			.get('/users/' + user.user_id + '/picture')
    			.set('Accept', 'application/json')
    			.end(function(err, res) {
    			    if (err) return done(err);
    			    res.body.should.have.property('status');
    			    res.body.status.should.equal('profile picture not found');
    			    res.body.should.have.property('user_id');
    			    done();
    			});
    		});
    	    });

	    // describe('has profile picture', function() {
	    // 	it('should return 200', function(done) {
    	    // 	    request(url)
    	    // 		.get('/users/' + user.user_id + '/picture')
    	    // 		.set('Accept', 'application/json')
    	    // 		.expect(200)
    	    // 		.end(function(err, res) {
    	    // 		    if (err) return done(err);
    	    // 		    done();
    	    // 		});
	    // 	});
	    // });
    	})
    });

});
