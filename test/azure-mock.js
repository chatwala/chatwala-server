var os = require('os');
var fs = require('fs');

var deleteFolderRecursive = function(path) {
    if( fs.existsSync(path) ) {
	fs.readdirSync(path).forEach(function(file,index) {
	    var curPath = path + "/" + file;
	    if(fs.statSync(curPath).isDirectory()) { // recurse
		deleteFolderRecursive(curPath);
	    } else { // delete file
		fs.unlinkSync(curPath);
	    }
	});
	fs.rmdirSync(path);
    }
};

function BlobService(storageAccount, storageAccessKey) {
    this.account = storageAccount;
    this.key = storageAccessKey;
    this.tmpdir = os.tmpdir();
    this.path = this.tmpdir + this.account + '-' + this.key;

    var self = this;
    if (fs.existsSync(this.path)) {
	deleteFolderRecursive(self.path);
    }

    if (fs.existsSync(self.tmpdir)) {
	fs.mkdirSync(self.path, function(err) {
	    if (err) { console.log(err); }
	});
    }
};

BlobService.prototype.createContainerIfNotExists = function(container, callback) {
    var containerPath = this.path + '/' + container;
    if (fs.existsSync(containerPath)) {
	deleteFolderRecursive(containerPath);
    }

    fs.mkdirSync(containerPath, function(err) {
	console.log(err);
	callback(err);
    });
};

BlobService.prototype.getBlobToFile = function (container, blob, localFilename, callback) {
    var blobPath = this.path + '/' + container + '/' + blob;
    if (fs.existsSync(blobPath)) {
	fs.createReadStream(blobPath).pipe(fs.createWriteStream(localFilename));
	callback();
    }
    else {
	callback(new Error('no such blob'));
    }
};

BlobService.prototype.getBlobToStream = function (container, blob, response, callback) {
    var blobPath = this.path + '/' + container + '/' + blob;
    if (fs.existsSync(blobPath)) {
	var fileStream = fs.createReadStream(blobPath);
	fileStream.pipe(response);
    }
    else {
	callback(new Error('no such blob'));
    }
};

BlobService.prototype.createBlockBlobFromFile = function(container, blob, localFilename, callback) {
    var blobPath = this.path + '/' + container + '/' + blob;
    if (fs.existsSync(blobPath)) {
	fs.unlinkSync(blobPath);
    }
    fs.createReadStream(localFilename).pipe(fs.createWriteStream(blobPath));
    callback();
};

module.exports.createBlobService = function (storageAccount, storageAccessKey) {
    return new BlobService(storageAccount, storageAccessKey);
};
