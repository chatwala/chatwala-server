var should = require('should');
var request = require('supertest');

var target = require('../routes/index.js');

describe('Routing', function() {
    var request;
    var response;

    before(function(done) {
	request = {};
	response = {
	    viewName: "",
	    data : {},
	    render: function(view, viewData) {
		this.viewName = view;
		this.data = viewData;
	    }
	};
	done();
    });

    describe('Default Route', function() {
	before(function(done) {
	    target.index(request, response);
	    done();
	});

        it('should provide index view name', function(done) {
            response.viewName.should.equal("index");
	    done();
	});

	it('should provide default view data', function(done) {
	    response.data['title'].should.equal('chatwala');
	    done();
	});
    });
});
