var should = require('should');
var request = require('supertest');

var target = require('../routes/index.js');

describe('Index', function() {
    var request;
    var response;

    before(function() {
	request = {};
	response = {
	    viewName: "",
	    data : {},
	    render: function(view, viewData) {
		this.viewName = view;
		this.data = viewData;
	    }
	};
    });

    describe('index', function() {
	before(function() {
	    target.index(request, response);
	});

        it('should provide index view name', function() {
            response.viewName.should.equal("index");
	});

	it('should provide default view data', function() {
	    response.data['title'].should.equal('chatwala');
	});
    });
});
