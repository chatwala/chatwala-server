var os = require('os');
var fs = require('fs');
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

	    describe('has profile picture', function() {
		before(function() {
		    var blobPath = os.tmpdir() + config.azure.storage_name + '-' + config.azure.storage_key + '/messages/' + user.user_id;
		    fs.createReadStream('./public/images/message_thumb.png').pipe(fs.createWriteStream(blobPath));
		});

		it('should return 200', function(done) {
    		    request(url)
    		     	.get('/users/' + user.user_id + '/picture')
    		     	.set('Accept', 'application/octet-stream')
    		     	.expect(200)
    		     	.end(function(err, res) {
    			    if (err) return done(err);
    			    done();
    			});
		});

		it('should return an image', function(done) {
    		    request(url)
    		     	.get('/users/' + user.user_id + '/picture')
    		     	.set('Accept', 'application/octet-stream')
    		     	.end(function(err, res) {
    			    if (err) return done(err);
			    res.text.should.not.be.empty
    			    done();
    			});
		});
	    });
    	})
    });

    describe('PUT /users/1/picture', function() {
	describe('no valid user', function() {
	    it('should return a 404', function(done) {
		var user_id = GUIDUtil.GUID();
		request(url)
		    .put('/users/' + user_id + '/picture')
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
	    	    .put('/users/' + user_id + '/picture')
	    	    .set('Accept', 'application/json')
	    	    .end(function(err, res) {
	    		if (err) return done(err);
	    		res.body.should.have.property('status');
	    		res.body.status.should.equal('user not found');
	    		res.body.should.have.property('user_id');
	    		done();
	    	    });
	    });
	});

    	describe('valid user', function() {
    	    var user = new User.Model();
	    var imageFile = "./public/images/message_thumb.png";

    	    before(function(done) {
    		user.save();
    		done();
    	    });

	    describe('on unsuccessful upload', function() {
		describe('on fail save blob', function() {
		    it('should return 404', function(done) {
    			done();
		    });
		});
	    });

	    describe('on successful upload', function(done) {
    		it('should return a 200', function(done) {
		    var lstat = fs.lstatSync(imageFile);
    		    var req = request(url)
			.put('/users/' + user.user_id + '/picture')
			.type('png')
    		     	.set('Accept', 'application/json')
			.set('Content-Length', lstat.size);
		    req.write(fs.readFileSync(imageFile));

		    req.expect(200);
    		    req.end(function(err, res) {
			if (err) return done(err);
    			done();
    		    });
    		});

		it('should save the upload', function(done) {
		    var blobPath = os.tmpdir() + config.azure.storage_name + '-' + config.azure.storage_key + '/messages/' + user.user_id;
		    fs.existsSync(blobPath).should.be.true;
		    done();
		});

		it('should return a json status', function(done) {
		    var lstat = fs.lstatSync(imageFile);
    		    var req = request(url)
			.put('/users/' + user.user_id + '/picture')
			.type('png')
    		     	.set('Accept', 'application/json')
			.set('Content-Length', lstat.size);
		    req.write(fs.readFileSync(imageFile));

		    req.expect(200);
    		    req.end(function(err, res) {
			if (err) return done(err);
			res.body.should.have.property('status');
			res.body.status.should.equal('OK');
    			done();
    		    });
		});
    	    });
	});
    });
});
