var assert = require('assert');
var expect = require('chai').expect;
var Trie = require('../lib/trie');

describe('Trie', function() {
  var trie;

  describe('trie.add()', function() {

    beforeEach(function() {
      trie = new Trie();
    });

    it('has empty root node with only methods key', function() {
      expect(trie).to.have.keys('methods');
    });

    it('create a node for a path with single part, no verb-handler', function() {
      trie.add('/Planets');
      expect(trie).to.have.property('Planets');
      expect(trie.Planets).to.have.property('methods');
    });

    it('registers handler for path: /Planets', function() {
      trie.add('/Planets', 'get', 'handler()');
      expect(trie).to.have.deep.property('Planets.methods.get', 'handler()');
    });

    it('registers handler for path: /Planets/count', function() {
      trie.add('/Planets/count', 'get', 'count()');
      expect(trie).to.have.deep.property('Planets.count.methods.get', 'count()');
    });

    it('registers different HTTP verb handlers for the same path ', function() {
      trie.add('/Planets', 'get', 'getHandler()');
      trie.add('/Planets', 'post', 'postHandler()');
      trie.add('/Planets', 'delete', 'deleteHandler()');

      expect(trie).to.have.deep.property('Planets.methods.get', 'getHandler()');
      expect(trie).to.have.deep.property('Planets.methods.post', 'postHandler()');
      expect(trie).to.have.deep.property('Planets.methods.delete', 'deleteHandler()');
    });

    it('While registering more than one handlers for one verb+path,' +
      ' preserves the handler which was registered first', function() {

        trie.add('/Planets', 'get', 'getHandler()');
        trie.add('/Planets', 'get', 'anotherGetHandler()');
        expect(trie).to.have.deep.property('Planets.methods.get', 'getHandler()');
        expect(trie).to.have.deep.property('Planets.methods.get')
          .to.not.equal('anotherGetHandler()');
      });
  });

  describe('trie.find()', function() {

    it('should return handler for matching path', function() {
      expect(trie).to.have.property('Planets');
      trie.add('/Planets/count', 'get', 'getCount()');
      trie.add('/Planets/count', 'post', 'postCount()');
      var handlers = trie.find('/Planets/count');
      expect(handlers.get).to.be.equal('getCount()');
      expect(handlers.post).to.be.equal('postCount()');

      //handlers = trie.find('/Planets');
      //expect(handlers.get).to.be.equal('handler2()');
    });
  });
});
