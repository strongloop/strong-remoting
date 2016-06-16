var assert = require('assert');
var expect = require('chai').expect;
var RouterLookup = require('../lib/router-lookup');

describe.only('Router-Lookup', function() {
  var routerLookup, verb, fullPath;

  describe('functional test for routerLookup.addNodes()', function() {
    beforeEach(function() {
      routerLookup = new RouterLookup();
      verb = '';
      fullPath = '';
    });

    it('has empty root node with only methods key', function() {
      expect(routerLookup).to.have.keys('methods');
    });

    it('registers hanlder for path: / to root node', function() {
      routerLookup.addNode('get', '/', 'rootHanlder()');
      expect(routerLookup.methods).to.have.keys('get');
    });

    it('registers handler for path: /Planets', function() {
      routerLookup.addNode('get', '/Planets', 'handler()');
      expect(routerLookup).to.have.deep.property('Planets.methods.get', 'handler()');
    });

    it('registers handler for path: /Planets/count', function() {
      routerLookup.addNode('get', '/Planets/count', 'count()');
      expect(routerLookup).to.have.deep.property('Planets.count.methods.get', 'count()');
    });

    it('registers different HTTP verb handlers for the same path ', function() {
      routerLookup.addNode('get', '/Planets', 'getHandler()');
      expect(routerLookup).to.have.deep.property('Planets.methods.get', 'getHandler()');
      routerLookup.addNode('post', '/Planets', 'postHandler()');
      expect(routerLookup).to.have.deep.property('Planets.methods.post', 'postHandler()');
      routerLookup.addNode('delete', '/Planets', 'deleteHandler()');
      expect(routerLookup)
        .to.have.deep.property('Planets.methods.delete', 'deleteHandler()');
    });

    it('While registering more than one handler for one verb+path,' +
      ' preserves the handler which was registered first', function() {
      routerLookup.addNode('get', '/Planets', 'getHandler()');
      expect(routerLookup).to.have.deep.property('Planets.methods.get', 'getHandler()');
      routerLookup.addNode('get', '/Planets', 'anotherGetHandler()');

      expect(routerLookup).to.have.deep.property('Planets.methods.get')
          .to.not.equal('anotherGetHandler()');
    });
  });

  describe('functional test for routerLookup.matchRequestPath()', function() {
    it('should return handler for matching path', function() {
      expect(routerLookup).to.have.property('Planets');
      routerLookup.addNode('get', '/Planets/count', 'getCount()');
      routerLookup.addNode('post', '/Planets/count', 'postCount()');
      var handlers = routerLookup.matchRequestPath('/Planets/count');
      expect(handlers.get).to.be.equal('getCount()');
      expect(handlers.post).to.be.equal('postCount()');
    });
  });
});
