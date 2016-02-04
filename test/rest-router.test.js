var assert = require('assert');
var expect = require('chai').expect;
var RestRouter = require('../lib/rest-router');

describe('Custom Router', function() {
  var restRouter;
  var route = { verb: 'get', fullPath: '/Planets' };
  var handler = function(req, res, next) { res.handled = true; };
  var req = {
    method: 'get',
    url: '/Planets',
  };
  var res = {};
  var next = function() { res.calledWhenPathNotFound = true; };

  beforeEach(function() {
    restRouter = new RestRouter();
  });

  describe('RestRouter()', function() {

    it('initiates a restRouter obj with Trie and options', function() {
      expect(restRouter).to.have.keys(['trie', 'options']);
    });
  });

  describe('restRouter.registerPathAndHandlers()', function() {
    it('register handler for GET: /Planets', function() {
      restRouter.registerPathAndHandlers(route, handler);
      expect(restRouter.trie).to.have.deep.property('planets.methods.get');
    });
  });

  describe('restRouter.handle()', function() {
    it('returns a function --which invokes matching handler-- with three arguments',
      function() {
        restRouter.registerPathAndHandlers(route, handler);
        var returned = restRouter.handle();
        expect(returned).to.have.length(3);
      });

    it('invokes the handler function for matching verb+path',
      function() {
        restRouter.registerPathAndHandlers(route, handler);
        restRouter.handle()(req, res, next);
        expect(res.handled).to.be.true;
      });

    it('invokes supplied next() if no matching handler found for verb+path',
      function() {
        restRouter.registerPathAndHandlers(route, handler);
        req.method = 'post';
        res = {};
        restRouter.handle()(req, res, next);
        expect(res.calledWhenPathNotFound).to.be.true;
        expect(res.handled).to.be.undefined;
      });
  });

});
