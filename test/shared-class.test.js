// Copyright IBM Corp. 2014,2018. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

const assert = require('assert');
const extend = require('util')._extend;
const expect = require('chai').expect;
const SharedClass = require('../lib/shared-class');
const factory = require('./helpers/shared-objects-factory.js');
const RemoteObjects = require('../');
const RestAdapter = require('../lib/rest-adapter');
function NOOP() {}

describe('SharedClass', function() {
  let SomeClass;
  beforeEach(function() { SomeClass = factory.createSharedClass(); });

  describe('constructor', function() {
    it('fills http.path from ctor.http', function() {
      SomeClass.http = {path: '/foo'};
      const sc = new SharedClass('some', SomeClass);
      expect(sc.http.path).to.equal('/foo');
    });

    it('fills http.path using the name', function() {
      const sc = new SharedClass('some', SomeClass);
      expect(sc.http.path).to.equal('/some');
    });

    it('fills http.path using a normalized path', function() {
      const sc = new SharedClass('SomeClass', SomeClass, {normalizeHttpPath: true});
      const remotes = RemoteObjects.create();
      remotes.addClass(sc);
      const classes = new RestAdapter(remotes).getClasses();
      expect(classes[0]).to.have.property('routes')
        .eql([{path: '/some-class', verb: 'all'}]);
    });

    it('does not require a sharedConstructor', function() {
      const myClass = {};
      myClass.remoteNamespace = 'bar';
      myClass.foo = function() {};
      myClass.foo.shared = true;

      const sc = new SharedClass(undefined, myClass);
      const fns = sc.methods().map(getName);
      expect(fns).to.contain('foo');
      expect(sc.http).to.eql({path: '/bar'});
    });
  });

  describe('sharedClass.methods()', function() {
    it('discovers remote methods', function() {
      const sc = new SharedClass('some', SomeClass);
      SomeClass.staticMethod = function() {};
      SomeClass.staticMethod.shared = true;
      SomeClass.prototype.instanceMethod = function() {};
      SomeClass.prototype.instanceMethod.shared = true;
      const fns = sc.methods().map(getFn);
      expect(fns).to.contain(SomeClass.staticMethod);
      expect(fns).to.contain(SomeClass.prototype.instanceMethod);
    });

    it('returns all methods when includeDisabled is true', function() {
      const sc = new SharedClass('MySharedClass', MySharedClass);
      function MySharedClass() {
        // this page left intentionally blank
      }

      const inputNames = ['foo', 'bar'];

      sc.defineMethod(inputNames[0], {shared: false, isStatic: true});
      sc.defineMethod(inputNames[1], {shared: true, isStatic: true});

      const outputNames = sc.methods({includeDisabled: true}).map(function(m) {
        return m.name;
      });

      expect(outputNames).to.eql(inputNames);
    });

    it('only discovers a function once with aliases', function() {
      function MyClass() {}
      const sc = new SharedClass('some', MyClass);
      const fn = function() {};
      fn.shared = true;
      MyClass.a = fn;
      MyClass.b = fn;
      MyClass.prototype.a = fn;
      MyClass.prototype.b = fn;
      const methods = sc.methods();
      const fns = methods.map(getFn);
      expect(fns.length).to.equal(1);
      expect(methods[0].aliases.sort()).to.eql(['a', 'b']);
    });

    it('discovers multiple functions correctly', function() {
      function MyClass() {}
      const sc = new SharedClass('some', MyClass);
      MyClass.a = createSharedFn();
      MyClass.b = createSharedFn();
      MyClass.prototype.a = createSharedFn();
      MyClass.prototype.b = createSharedFn();
      const fns = sc.methods().map(getFn);
      expect(fns.length).to.equal(4);
      expect(fns).to.contain(MyClass.a);
      expect(fns).to.contain(MyClass.b);
      expect(fns).to.contain(MyClass.prototype.a);
      expect(fns).to.contain(MyClass.prototype.b);
      function createSharedFn() {
        const fn = function() {};
        fn.shared = true;
        return fn;
      }
    });

    it('should skip properties that are model classes', function() {
      const sc = new SharedClass('some', SomeClass);
      function MockModel1() {}
      MockModel1.modelName = 'M1';
      MockModel1.shared = true;
      SomeClass.staticMethod = MockModel1;

      function MockModel2() {}
      MockModel2.modelName = 'M2';
      MockModel2.shared = true;
      SomeClass.prototype.instanceMethod = MockModel2;
      const fns = sc.methods().map(getFn);
      expect(fns).to.not.contain(SomeClass.staticMethod);
      expect(fns).to.not.contain(SomeClass.prototype.instanceMethod);
    });
  });

  describe('sharedClass.defineMethod(name, options)', function() {
    it('defines a remote method', function() {
      const sc = new SharedClass('SomeClass', SomeClass);
      SomeClass.prototype.myMethod = function() {};
      const METHOD_NAME = 'myMethod';
      sc.defineMethod(METHOD_NAME, {
        prototype: true,
      });
      const methods = sc.methods().map(getName);
      expect(methods).to.contain(METHOD_NAME);
    });

    it('defines a remote method with accessType', function() {
      const sc = new SharedClass('SomeClass', SomeClass);
      SomeClass.prototype.myMethod = function() {};
      const METHOD_NAME = 'myMethod';
      sc.defineMethod(METHOD_NAME, {
        isStatic: true,
        prototype: true,
        accessType: 'READ',
      });
      const methods = sc.methods().map(getName);
      expect(methods).to.contain(METHOD_NAME);
      expect(sc.findMethodByName(METHOD_NAME).accessType).to.eql('READ');
    });

    it('defines a remote method with arbitrary custom metadata', function() {
      const sc = new SharedClass('SomeClass', SomeClass);
      SomeClass.prototype.testFn = function() {};
      sc.defineMethod('testFn', {
        isStatic: true,
        accessScope: 'read:custom',
      });
      expect(sc.findMethodByName('testFn').accessScope).to.eql('read:custom');
    });

    it('should allow a shared class to resolve dynamically defined functions',
      function(done) {
        const MyClass = function() {};
        const METHOD_NAME = 'dynFn';
        process.nextTick(function() {
          MyClass[METHOD_NAME] = function(str, cb) {
            cb(null, str);
          };
          done();
        });

        const sharedClass = new SharedClass('MyClass', MyClass);

        sharedClass.defineMethod(METHOD_NAME, {});
        const methods = sharedClass.methods().map(getName);
        expect(methods).to.contain(METHOD_NAME);
      });
  });

  describe('sharedClass.resolve(resolver)', function() {
    it('should allow sharedMethods to be resolved dynamically', function() {
      function MyClass() {}
      MyClass.obj = {
        dyn: function(cb) {
          cb();
        },
      };
      const sharedClass = new SharedClass('MyClass', MyClass);
      sharedClass.resolve(function(define) {
        define('dyn', {}, MyClass.obj.dyn);
      });
      const methods = sharedClass.methods().map(getName);
      expect(methods).to.contain('dyn');
    });
  });

  describe('sharedClass.find()', function() {
    ignoreDeprecationsInThisBlock();
    let sc, sm;

    beforeEach(function() {
      sc = new SharedClass('SomeClass', SomeClass);
      SomeClass.prototype.myMethod = function() {};
      const METHOD_NAME = 'myMethod';
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
      const sc = new SharedClass('SomeClass', SomeClass);
      const sm = sc.defineMethod('testMethod', {
        isStatic: false,
      });
      assert(sc.findMethodByName('prototype.testMethod') === sm);
    });

    it('find sharedMethod by static method name', function() {
      const sc = new SharedClass('SomeClass', SomeClass);
      const sm = sc.defineMethod('myMethod', {
        isStatic: true,
      });
      assert(sc.findMethodByName('myMethod') === sm);
    });
  });

  describe('remotes.addClass(sharedClass)', function() {
    it('should make the class available', function() {
      const CLASS_NAME = 'SomeClass';
      const remotes = RemoteObjects.create();
      const sharedClass = new SharedClass(CLASS_NAME, SomeClass);
      remotes.addClass(sharedClass);
      const classes = remotes.classes().map(getName);
      expect(classes).to.contain(CLASS_NAME);
    });
  });

  describe('sharedClass.disableMethod(methodName, isStatic)', function() {
    ignoreDeprecationsInThisBlock();
    let sc, sm;
    const METHOD_NAME = 'testMethod';
    const INST_METHOD_NAME = 'instTestMethod';
    const DYN_METHOD_NAME = 'dynMethod';

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
      const methods = sc.methods().map(getName);
      expect(methods).to.not.contain(METHOD_NAME);
    });

    it('excludes disabled prototype methods from the method list', function() {
      sc.disableMethod(INST_METHOD_NAME, false);
      const methods = sc.methods().map(getName);
      expect(methods).to.not.contain(INST_METHOD_NAME);
    });

    it('excludes disabled dynamic (resolved) methods from the method list', function() {
      sc.disableMethod(DYN_METHOD_NAME, true);
      const methods = sc.methods().map(getName);
      expect(methods).to.not.contain(DYN_METHOD_NAME);
    });
  });

  describe('sharedClass.disableMethodByName(methodName)', function() {
    let sc, sm;

    beforeEach(function() {
      sc = new SharedClass('SomeClass', SomeClass);
    });

    describe('for static methods', function() {
      const STATIC_METHOD_NAME = 'testMethod';
      const STATIC_METHOD_ALIAS = 'testMethodAlias';

      beforeEach(function() {
        sm = sc.defineMethod(STATIC_METHOD_NAME, {
          isStatic: true,
          aliases: [STATIC_METHOD_ALIAS],
        });
      });

      it('excludes methods from the method list disabled by name', function() {
        sc.disableMethodByName(STATIC_METHOD_NAME);
        const methods = sc.methods().map(getName);
        expect(methods).to.not.contain(STATIC_METHOD_NAME);
      });

      it('excludes methods from the method list disabled by alias',
        function() {
          let methods = sc.methods().map(getName);
          expect(methods).to.contain(STATIC_METHOD_NAME);
          sc.disableMethodByName(STATIC_METHOD_ALIAS);
          methods = sc.methods().map(getName);
          expect(methods).to.not.contain(STATIC_METHOD_NAME);
        });

      it('does not exclude methods from the method list using a prototype ' +
      'method name', function() {
        let methods = sc.methods().map(getName);
        expect(methods).to.contain(STATIC_METHOD_NAME);
        sc.disableMethodByName('prototype.'.concat(STATIC_METHOD_NAME));
        methods = sc.methods().map(getName);
        expect(methods).to.contain(STATIC_METHOD_NAME);
      });

      it('does not exclude methods from the method list using a prototype ' +
      'method alias', function() {
        let methods = sc.methods().map(getName);
        expect(methods).to.contain(STATIC_METHOD_NAME);
        sc.disableMethodByName('prototype.'.concat(STATIC_METHOD_ALIAS));
        methods = sc.methods().map(getName);
        expect(methods).to.contain(STATIC_METHOD_NAME);
      });
    });

    describe('for prototype methods', function() {
      const INST_METHOD_BASENAME = 'instTestMethod';
      const INST_METHOD_FULLNAME = 'prototype.instTestMethod';
      const INST_METHOD_BASEALIAS = 'instTestMethodAlias';
      const INST_METHOD_FULLALIAS = 'prototype.instTestMethodAlias';

      beforeEach(function() {
        sm = sc.defineMethod(INST_METHOD_BASENAME, {
          isStatic: false,
          aliases: [INST_METHOD_BASEALIAS],
        });
      });

      it('excludes methods from the method list disabled by name',
        function() {
          sc.disableMethodByName(INST_METHOD_FULLNAME);
          const methods = sc.methods().map(getName);
          expect(methods).to.not.contain(INST_METHOD_FULLNAME);
          expect(methods).to.not.contain(INST_METHOD_BASENAME);
        });

      it('excludes methods from the method list disabled by alias',
        function() {
          let methods = sc.methods().map(getName);
          expect(methods).to.contain(INST_METHOD_BASENAME);
          sc.disableMethodByName(INST_METHOD_FULLALIAS);
          methods = sc.methods().map(getName);
          expect(methods).to.not.contain(INST_METHOD_BASENAME);
        });

      it('does not exclude methods from the method list using ' +
      'static method name', function() {
        let methods = sc.methods().map(getName);
        expect(methods).to.contain(INST_METHOD_BASENAME);
        sc.disableMethodByName(INST_METHOD_BASENAME);
        methods = sc.methods().map(getName);
        expect(methods).to.contain(INST_METHOD_BASENAME);
      });

      it('does not exclude methods from the method list using ' +
      'static method alias', function() {
        let methods = sc.methods().map(getName);
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
