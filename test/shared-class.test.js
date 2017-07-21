// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var assert = require('assert');
var extend = require('util')._extend;
var expect = require('chai').expect;
var SharedClass = require('../lib/shared-class');
var factory = require('./helpers/shared-objects-factory.js');
var RemoteObjects = require('../');
var RestAdapter = require('../lib/rest-adapter');
function NOOP() {};

describe('SharedClass', function() {
  var SomeClass;
  beforeEach(function() { SomeClass = factory.createSharedClass(); });

  describe('constructor', function() {
    it('fills http.path from ctor.http', function() {
      SomeClass.http = {path: '/foo'};
      var sc = new SharedClass('some', SomeClass);
      expect(sc.http.path).to.equal('/foo');
    });

    it('fills http.path using the name', function() {
      var sc = new SharedClass('some', SomeClass);
      expect(sc.http.path).to.equal('/some');
    });

    it('fills http.path using a normalized path', function() {
      var sc = new SharedClass('SomeClass', SomeClass, {normalizeHttpPath: true});
      var remotes = RemoteObjects.create();
      remotes.addClass(sc);
      var classes = new RestAdapter(remotes).getClasses();
      expect(classes[0]).to.have.property('routes')
        .eql([{path: '/some-class', verb: 'all'}]);
    });

    it('does not require a sharedConstructor', function() {
      var myClass = {};
      myClass.remoteNamespace = 'bar';
      myClass.foo = function() {};
      myClass.foo.shared = true;

      var sc = new SharedClass(undefined, myClass);
      var fns = sc.methods().map(getName);
      expect(fns).to.contain('foo');
      expect(sc.http).to.eql({path: '/bar'});
    });
  });

  describe('sharedClass.methods()', function() {
    it('discovers remote methods', function() {
      var sc = new SharedClass('some', SomeClass);
      SomeClass.staticMethod = function() {};
      SomeClass.staticMethod.shared = true;
      SomeClass.prototype.instanceMethod = function() {};
      SomeClass.prototype.instanceMethod.shared = true;
      var fns = sc.methods().map(getFn);
      expect(fns).to.contain(SomeClass.staticMethod);
      expect(fns).to.contain(SomeClass.prototype.instanceMethod);
    });

    it('returns all methods when includeDisabled is true', function() {
      var sc = new SharedClass('MySharedClass', MySharedClass);
      function MySharedClass() {
        // this page left intentionally blank
      }

      var inputNames = ['foo', 'bar'];

      sc.defineMethod(inputNames[0], {shared: false, isStatic: true});
      sc.defineMethod(inputNames[1], {shared: true, isStatic: true});

      var outputNames = sc.methods({includeDisabled: true}).map(function(m) {
        return m.name;
      });

      expect(outputNames).to.eql(inputNames);
    });

    it('only discovers a function once with aliases', function() {
      function MyClass() {}
      var sc = new SharedClass('some', MyClass);
      var fn = function() {};
      fn.shared = true;
      MyClass.a = fn;
      MyClass.b = fn;
      MyClass.prototype.a = fn;
      MyClass.prototype.b = fn;
      var methods = sc.methods();
      var fns = methods.map(getFn);
      expect(fns.length).to.equal(1);
      expect(methods[0].aliases.sort()).to.eql(['a', 'b']);
    });

    it('discovers multiple functions correctly', function() {
      function MyClass() {}
      var sc = new SharedClass('some', MyClass);
      MyClass.a = createSharedFn();
      MyClass.b = createSharedFn();
      MyClass.prototype.a = createSharedFn();
      MyClass.prototype.b = createSharedFn();
      var fns = sc.methods().map(getFn);
      expect(fns.length).to.equal(4);
      expect(fns).to.contain(MyClass.a);
      expect(fns).to.contain(MyClass.b);
      expect(fns).to.contain(MyClass.prototype.a);
      expect(fns).to.contain(MyClass.prototype.b);
      function createSharedFn() {
        var fn = function() {};
        fn.shared = true;
        return fn;
      }
    });

    it('should skip properties that are model classes', function() {
      var sc = new SharedClass('some', SomeClass);
      function MockModel1() {}
      MockModel1.modelName = 'M1';
      MockModel1.shared = true;
      SomeClass.staticMethod = MockModel1;

      function MockModel2() {}
      MockModel2.modelName = 'M2';
      MockModel2.shared = true;
      SomeClass.prototype.instanceMethod = MockModel2;
      var fns = sc.methods().map(getFn);
      expect(fns).to.not.contain(SomeClass.staticMethod);
      expect(fns).to.not.contain(SomeClass.prototype.instanceMethod);
    });
  });

  describe('sharedClass.defineMethod(name, options)', function() {
    it('defines a remote method', function() {
      var sc = new SharedClass('SomeClass', SomeClass);
      SomeClass.prototype.myMethod = function() {};
      var METHOD_NAME = 'myMethod';
      sc.defineMethod(METHOD_NAME, {
        prototype: true,
      });
      var methods = sc.methods().map(getName);
      expect(methods).to.contain(METHOD_NAME);
    });

    it('defines a remote method with accessType', function() {
      var sc = new SharedClass('SomeClass', SomeClass);
      SomeClass.prototype.myMethod = function() {};
      var METHOD_NAME = 'myMethod';
      sc.defineMethod(METHOD_NAME, {
        isStatic: true,
        prototype: true,
        accessType: 'READ',
      });
      var methods = sc.methods().map(getName);
      expect(methods).to.contain(METHOD_NAME);
      expect(sc.findMethodByName(METHOD_NAME).accessType).to.eql('READ');
    });

    it('defines a remote method with arbitrary custom metadata', function() {
      var sc = new SharedClass('SomeClass', SomeClass);
      SomeClass.prototype.testFn = function() {};
      sc.defineMethod('testFn', {
        isStatic: true,
        accessScope: 'read:custom',
      });
      expect(sc.findMethodByName('testFn').accessScope).to.eql('read:custom');
    });

    it('should allow a shared class to resolve dynamically defined functions',
      function(done) {
        var MyClass = function() {};
        var METHOD_NAME = 'dynFn';
        process.nextTick(function() {
          MyClass[METHOD_NAME] = function(str, cb) {
            cb(null,  str);
          };
          done();
        });

        var sharedClass = new SharedClass('MyClass', MyClass);

        sharedClass.defineMethod(METHOD_NAME, {});
        var methods = sharedClass.methods().map(getName);
        expect(methods).to.contain(METHOD_NAME);
      }
    );
  });

  describe('sharedClass.resolve(resolver)', function() {
    it('should allow sharedMethods to be resolved dynamically', function() {
      function MyClass() {}
      MyClass.obj = {
        dyn: function(cb) {
          cb();
        },
      };
      var sharedClass = new SharedClass('MyClass', MyClass);
      sharedClass.resolve(function(define) {
        define('dyn', {}, MyClass.obj.dyn);
      });
      var methods = sharedClass.methods().map(getName);
      expect(methods).to.contain('dyn');
    });
  });

  describe('sharedClass.find()', function() {
    ignoreDeprecationsInThisBlock();
    var sc, sm;

    beforeEach(function() {
      sc = new SharedClass('SomeClass', SomeClass);
      SomeClass.prototype.myMethod = function() {};
      var METHOD_NAME = 'myMethod';
      sm = sc.defineMethod(METHOD_NAME, {
        prototype: true,
      });
    });

    it('finds sharedMethod for the given function', function() {
      assert(sc.find(SomeClass.prototype.myMethod) === sm);
    });

    it('find sharedMethod by name', function() {
      assert(sc.find('myMethod') === sm);
    });
  });

  describe('sharedClass.findMethodByName()', function() {
    it('finds sharedMethod by prototype method name', function() {
      var sc = new SharedClass('SomeClass', SomeClass);
      var sm = sc.defineMethod('testMethod', {
        isStatic: false,
      });
      assert(sc.findMethodByName('prototype.testMethod') === sm);
    });

    it('find sharedMethod by static method name', function() {
      var sc = new SharedClass('SomeClass', SomeClass);
      var sm = sc.defineMethod('myMethod', {
        isStatic: true,
      });
      assert(sc.findMethodByName('myMethod') === sm);
    });
  });

  describe('remotes.addClass(sharedClass)', function() {
    it('should make the class available', function() {
      var CLASS_NAME = 'SomeClass';
      var remotes = RemoteObjects.create();
      var sharedClass = new SharedClass(CLASS_NAME, SomeClass);
      remotes.addClass(sharedClass);
      var classes = remotes.classes().map(getName);
      expect(classes).to.contain(CLASS_NAME);
    });
  });

  describe('sharedClass.disableMethod(methodName, isStatic)', function() {
    ignoreDeprecationsInThisBlock();
    var sc, sm;
    var METHOD_NAME = 'testMethod';
    var INST_METHOD_NAME = 'instTestMethod';
    var DYN_METHOD_NAME = 'dynMethod';

    beforeEach(function() {
      sc = new SharedClass('SomeClass', SomeClass);
      sm = sc.defineMethod(METHOD_NAME, {isStatic: true});
      sm = sc.defineMethod(INST_METHOD_NAME, {isStatic: false});
      sc.resolve(function(define) {
        define(DYN_METHOD_NAME, {isStatic: true});
      });
    });

    it('excludes disabled static methods from the method list', function() {
      sc.disableMethod(METHOD_NAME, true);
      var methods = sc.methods().map(getName);
      expect(methods).to.not.contain(METHOD_NAME);
    });

    it('excludes disabled prototype methods from the method list', function() {
      sc.disableMethod(INST_METHOD_NAME, false);
      var methods = sc.methods().map(getName);
      expect(methods).to.not.contain(INST_METHOD_NAME);
    });

    it('excludes disabled dynamic (resolved) methods from the method list', function() {
      sc.disableMethod(DYN_METHOD_NAME, true);
      var methods = sc.methods().map(getName);
      expect(methods).to.not.contain(DYN_METHOD_NAME);
    });
  });

  describe('sharedClass.disableMethodByName(methodName)', function() {
    var sc, sm;

    beforeEach(function() {
      sc = new SharedClass('SomeClass', SomeClass);
    });

    describe('for static methods', function() {
      var STATIC_METHOD_NAME = 'testMethod';
      var STATIC_METHOD_ALIAS = 'testMethodAlias';

      beforeEach(function() {
        sm = sc.defineMethod(STATIC_METHOD_NAME, {
          isStatic: true,
          aliases: [STATIC_METHOD_ALIAS],
        });
      });

      it('excludes methods from the method list disabled by name', function() {
        sc.disableMethodByName(STATIC_METHOD_NAME);
        var methods = sc.methods().map(getName);
        expect(methods).to.not.contain(STATIC_METHOD_NAME);
      });

      it('excludes methods from the method list disabled by alias',
      function() {
        var methods = sc.methods().map(getName);
        expect(methods).to.contain(STATIC_METHOD_NAME);
        sc.disableMethodByName(STATIC_METHOD_ALIAS);
        methods = sc.methods().map(getName);
        expect(methods).to.not.contain(STATIC_METHOD_NAME);
      });

      it('does not exclude methods from the method list using a prototype ' +
      'method name', function() {
        var methods = sc.methods().map(getName);
        expect(methods).to.contain(STATIC_METHOD_NAME);
        sc.disableMethodByName('prototype.'.concat(STATIC_METHOD_NAME));
        methods = sc.methods().map(getName);
        expect(methods).to.contain(STATIC_METHOD_NAME);
      });

      it('does not exclude methods from the method list using a prototype ' +
      'method alias', function() {
        var methods = sc.methods().map(getName);
        expect(methods).to.contain(STATIC_METHOD_NAME);
        sc.disableMethodByName('prototype.'.concat(STATIC_METHOD_ALIAS));
        methods = sc.methods().map(getName);
        expect(methods).to.contain(STATIC_METHOD_NAME);
      });
    });

    describe('for prototype methods', function() {
      var INST_METHOD_BASENAME = 'instTestMethod';
      var INST_METHOD_FULLNAME = 'prototype.instTestMethod';
      var INST_METHOD_BASEALIAS = 'instTestMethodAlias';
      var INST_METHOD_FULLALIAS = 'prototype.instTestMethodAlias';

      beforeEach(function() {
        sm = sc.defineMethod(INST_METHOD_BASENAME, {
          isStatic: false,
          aliases: [INST_METHOD_BASEALIAS],
        });
      });

      it('excludes methods from the method list disabled by name',
      function() {
        sc.disableMethodByName(INST_METHOD_FULLNAME);
        var methods = sc.methods().map(getName);
        expect(methods).to.not.contain(INST_METHOD_FULLNAME);
        expect(methods).to.not.contain(INST_METHOD_BASENAME);
      });

      it('excludes methods from the method list disabled by alias',
      function() {
        var methods = sc.methods().map(getName);
        expect(methods).to.contain(INST_METHOD_BASENAME);
        sc.disableMethodByName(INST_METHOD_FULLALIAS);
        methods = sc.methods().map(getName);
        expect(methods).to.not.contain(INST_METHOD_BASENAME);
      });

      it('does not exclude methods from the method list using ' +
      'static method name', function() {
        var methods = sc.methods().map(getName);
        expect(methods).to.contain(INST_METHOD_BASENAME);
        sc.disableMethodByName(INST_METHOD_BASENAME);
        methods = sc.methods().map(getName);
        expect(methods).to.contain(INST_METHOD_BASENAME);
      });

      it('does not exclude methods from the method list using ' +
      'static method alias', function() {
        var methods = sc.methods().map(getName);
        expect(methods).to.contain(INST_METHOD_BASENAME);
        sc.disableMethodByName(INST_METHOD_BASEALIAS);
        methods = sc.methods().map(getName);
        expect(methods).to.contain(INST_METHOD_BASENAME);
      });
    });
  });
});

function getName(obj) {
  return obj.name;
}

function getFn(obj) {
  return obj.fn;
}

function ignoreDeprecationsInThisBlock() {
  before(function() {
    process.on('deprecation', NOOP);
  });

  after(function() {
    process.removeListener('deprecation', NOOP);
  });
}
