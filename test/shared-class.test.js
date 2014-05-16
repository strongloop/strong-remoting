var extend = require('util')._extend;
var expect = require('chai').expect;
var SharedClass = require('../lib/shared-class');
var factory = require('./helpers/shared-objects-factory.js');
var RemoteObjects = require('../');

describe('SharedClass', function() {
  var SomeClass;
  beforeEach(function() { SomeClass = factory.createSharedClass(); });

  describe('constructor', function() {
    it('fills http.path from ctor.http', function() {
      SomeClass.http = { path: '/foo' };
      var sc = new SharedClass('some', SomeClass);
      expect(sc.http.path).to.equal('/foo');
    });

    it('fills http.path using the name', function() {
      var sc = new SharedClass('some', SomeClass);
      expect(sc.http.path).to.equal('/some');
    });
  });

  describe('sharedClass.defineMethod(name, options)', function() {
    it('defines a remote method', function () {
      var sc = new SharedClass('SomeClass', SomeClass);
      SomeClass.prototype.myMethod = function() {};
      var METHOD_NAME = 'myMethod';
      sc.defineMethod(METHOD_NAME, {
        prototype: true
      });
      var methods = sc.methods().map(function(m) {return m.name});
      expect(methods).to.contain(METHOD_NAME);
    });
  });

  describe('remotes.addClass(sharedClass)', function() {
    it('should make the class available', function () {
      var CLASS_NAME = 'SomeClass';
      var remotes = RemoteObjects.create();
      var sharedClass = new SharedClass(CLASS_NAME, SomeClass);
      remotes.addClass(sharedClass);
      var classes = remotes.classes().map(function(c) {return c.name});
      expect(classes).to.contain(CLASS_NAME);
    });
  })
});
