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

    it('inserts a path with single part, no verb-handler', function() {
      trie.add('/Planets');
      expect(trie).to.have.property('Planets');
      expect(trie.Planets).to.have.property('methods');
    });

    it('registers GET handler for path', function() {
      trie.add('/Planets', 'get', 'handler()');
      expect(trie).to.have.deep.property('Planets.methods.get[0]', 'handler()');
    });

    it('registers multiple handlers for same path', function() {
      trie.add('/Planets', 'get', 'getHandler()');
      trie.add('/Planets', 'post', 'postHandler()');
      trie.add('/Planets', 'delete', 'deleteHandler()');

      expect(trie).to.have.deep.property('Planets.methods.get[0]', 'getHandler()');
      expect(trie).to.have.deep.property('Planets.methods.post[0]', 'postHandler()');
      expect(trie).to.have.deep.property('Planets.methods.delete[0]', 'deleteHandler()');
    });

    it('register multiple handlers for one verb+path', function() {
      trie.add('/Planets', 'get', 'handler1()');
      trie.add('/Planets', 'get', 'handler2()');
      expect(trie).to.have.deep.property('Planets.methods.get[0]', 'handler1()');
      expect(trie).to.have.deep.property('Planets.methods.get[1]', 'handler2()');
    });

  });

  describe('trie.find()', function() {
    it('should have trie with /Planets', function() {
      expect(trie).to.have.property('Planets');
    });
    it('should return all verb:[handlers] for matching path', function() {
      trie.add('/Planets/count', 'get', 'getCount()');
      trie.add('/Planets/count', 'post', 'postCount()');
      var handlers = trie.find('/Planets/count');
      expect(handlers.get[0]).to.be.equal('getCount()');
      expect(handlers.post[0]).to.be.equal('postCount()');

      handlers = trie.find('/Planets');
      expect(handlers.get[1]).to.be.equal('handler2()');
    });

  });
});
