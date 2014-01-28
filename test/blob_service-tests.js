var should = require('should');
var config = require('../config')();
var BlobService= require('../blob_service');

describe('BlobService', function() {
    var azure = null;
    before(function() {
	azure = {
	    account: "",
	    access_key: "",
	    createBlobService: function(acct, key) {
		this.account = acct;
		this.access_key = key;
		return this;
	    },
	}
    });

    it('should initialize', function() {
	var blob_service = BlobService.initializeBlobService(azure);
	blob_service.account.should.equal(config.azure.storage_name);
	blob_service.access_key.should.equal(config.azure.storage_key);
    });

    describe('initializeContainers()', function() {
	describe('with service initialization', function() {
	    before(function() {
		BlobService.initializeBlobService(azure);
		azure['container'] = "";
		azure['createContainerIfNotExists'] = function(containerName, callback) {
		    this.container = containerName;
		};
	    });

	    it('should initialize containers', function() {
		var blob_service = BlobService.initializeContainer("container", function(err) {});
		blob_service.container.should.equal("container");
	    });
	});

	describe('without service initialization', function() {
	    before(function() {
		azure['container'] = "";
		azure['createContainerIfNotExists'] = function(containerName, callback) {
		    callback(new Error());
		};
	    });

	    it('should callback with an error', function() {
		BlobService.initializeContainer("container", function(err) {
		    err.should.be.instanceof(Error);
		});
	    });
	});
    });

    describe('getBlobService()', function() {
	describe('with service initialization', function() {
	    before(function() {
		BlobService.initializeBlobService(azure);
	    });
	    
	    it('should return the blobService', function() {
		var blob_service = BlobService.getBlobService();
		blob_service.should.equal(azure);
	    });
	});

	describe('without service initialization', function() {
	    it('should throw an exception', function() {
		try {
		    BlobService.getBlobService();
		    should.fail('no error was thrown when it should have been')
		} catch(error) {
		    (error != null).should.be.true;
		}
	    });
	});
    });
});
