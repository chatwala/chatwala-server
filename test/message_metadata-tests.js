var mongoose = require('mongoose');
var GUIDUtil = require('GUIDUtil');
var config = require('../config')();

var User = require('../models/user');
var MessageMetadata = require('../models/message_metadata');

describe('MessageMetadata', function() {
    var sender;
    var recipient;

    before( function(done) {
	if (!mongoose.connection.db) { 
	    mongoose.connect('mongodb://localhost/chatwala-test');
	}

	sender = new User.Model();
	sender.save();

	recipient = new User.Model();
	recipient.save();

	done();
    });

    after(function(done) {
	mongoose.disconnect();
	done();
    });

    describe('creation', function() {
	var message_metadata = new MessageMetadata.Model();

	it('should create a uuid as message_id', function(done) {
	    message_metadata['message_id'].should.not.be.empty;
	    done();
	});

	it('should be unique', function(done) {
	    MessageMetadata.Model.find({ message_id: message_metadata['message_id'] }, function(err, message_metadatas) {
		message_metadatas.length.should.eql(0);
		done();
	    });
	});
   });

    describe('validation', function() {
	var message_metadata;

	before( function(done) { 
	    message_metadata = new MessageMetadata.Model();
	    message_metadata['thread_id']       = GUIDUtil.GUID();
	    message_metadata['thread_index']    = 1;
	    message_metadata['start_recording'] = 0.0;

	    done();
	});

	it('should require a sender_id', function(done) {
	    message_metadata.validate( function(err) {
	 	err.errors.sender_id.type.should.equal("required");
		done();
	    });
	});

	it('should require a valid sender', function(done) {
	    message_metadata['sender_id'] = GUIDUtil.GUID();
	    message_metadata.save( function(err) {
		err.message.should.equal("Sender does not exist");
		done();
	    });
	});

	describe('with a valid sender', function() {
	    before(function(done) {
		message_metadata['sender_id'] = sender['user_id'];
		done();
	    });
	    
	    it('should not require a recipient', function(done) {
	     	message_metadata['recipient_id'] = "";
	     	message_metadata.save( function(err) {
	     	    (err == null).should.be.true;
	     	    done();
	     	});
	    });

	    it('should require a valid recipient, if set', function(done) {
	    	message_metadata['recipient_id'] = GUIDUtil.GUID();
	    	message_metadata.save( function(err) {
	    	    err.message.should.equal("Recipient does not exist");
	    	    done();
	    	});
	    });
	});
    });
});

