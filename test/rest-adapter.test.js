// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var assert = require('assert');
var HttpInvocation = require('../lib/http-invocation');
var extend = require('util')._extend;
var inherits = require('util').inherits;
var RemoteObjects = require('../');
var RestAdapter = require('../lib/rest-adapter');
var SharedClass = require('../lib/shared-class');
var SharedMethod = require('../lib/shared-method');
var expect = require('chai').expect;
var factory = require('./helpers/shared-objects-factory.js');
function NOOP() {};

describe('RestAdapter', function() {
  var remotes;

  beforeEach(function() {
    remotes = RemoteObjects.create();
  });

  describe('getClasses()', function() {
    it('fills `name`', function() {
      remotes.exports.testClass = factory.createSharedClass();
      var classes = getRestClasses();
      expect(classes[0]).to.have.property('name', 'testClass');
    });

    it('fills `routes`', function() {
      remotes.exports.testClass = factory.createSharedClass();
      remotes.exports.testClass.http = {path: '/test-class', verb: 'any'};

      var classes = getRestClasses();

      expect(classes[0]).to.have.property('routes')
        .eql([{path: '/test-class', verb: 'any'}]);
    });

    it('fills `sharedClass`', function() {
      remotes.exports.testClass = factory.createSharedClass();
      var classes = getRestClasses();
      expect(classes[0]).to.have.property('sharedClass');
      expect(classes[0].sharedClass).to.be.an.instanceOf(SharedClass);
    });

    it('fills `ctor`', function() {
      var testClass = remotes.exports.testClass = factory.createSharedClass();
      testClass.sharedCtor.http = {path: '/shared-ctor', verb: 'all'};

      var classes = getRestClasses();

      expect(classes[0].ctor).to.have.property('routes')
        .eql([{path: '/shared-ctor', verb: 'all'}]);
    });

    it('fills static methods', function() {
      var testClass = remotes.exports.testClass = factory.createSharedClass();
      testClass.staticMethod = extend(someFunc, {shared: true});

      var methods = getRestClasses()[0].methods;

      expect(methods).to.have.length(1);
      expect(methods[0]).to.have.property('name', 'staticMethod');
      expect(methods[0]).to.have.property('fullName', 'testClass.staticMethod');
      expect(methods[0])
        .to.have.deep.property('routes[0].path', '/staticMethod');
    });

    it('fills prototype methods', function() {
      var testClass = remotes.exports.testClass = factory.createSharedClass();
      testClass.prototype.instanceMethod = extend(someFunc, {shared: true});

      var methods = getRestClasses()[0].methods;

      expect(methods).to.have.length(1);
      expect(methods[0])
        .to.have.property('fullName', 'testClass.prototype.instanceMethod');
      expect(methods[0])
        // Note: the `/id:` part is coming from testClass.sharedCtor
        .to.have.deep.property('routes[0].path', '/:id/instanceMethod');
    });

    function getRestClasses() {
      return new RestAdapter(remotes).getClasses();
    }
  });

  describe('path normalization', function() {
    it('fills `routes`', function() {
      remotes.exports.testClass = factory.createSharedClass();
      remotes.exports.testClass.http = {path: '/testClass', verb: 'any'};

      var classes = getRestClasses();

      expect(classes[0]).to.have.property('routes')
        .eql([{path: '/test-class', verb: 'any'}]);
    });

    function getRestClasses() {
      return new RestAdapter(remotes, {normalizeHttpPath: true}).getClasses();
    }
  });

  describe('RestClass', function() {
    describe('getPath', function() {
      it('returns the path of the first route', function() {
        var restClass = givenRestClass({http: [
          {path: '/a-path'},
          {path: '/another-path'},
        ]});
        expect(restClass.getPath()).to.equal('/a-path');
      });
    });

    function givenRestClass(config) {
      var ctor = factory.createSharedClass(config);
      remotes.testClass = ctor;
      var sharedClass = new SharedClass('testClass', ctor);
      return new RestAdapter.RestClass(sharedClass);
    }
  });

  describe('RestMethod', function() {
    var anArg = {arg: 'an-arg-name', type: String};

    it('has `accepts`', function() {
      var method = givenRestStaticMethod({accepts: anArg});
      expect(method.accepts).to.eql([anArg]);
    });

    it('has `returns`', function() {
      var method = givenRestStaticMethod({returns: anArg});
      expect(method.returns).to.eql([anArg]);
    });

    it('has `errors`', function() {
      var method = givenRestStaticMethod({errors: anArg});
      expect(method.errors).to.eql([anArg]);
    });

    it('has `description`', function() {
      var method = givenRestStaticMethod({description: 'a-desc'});
      expect(method.description).to.equal('a-desc');
    });

    it('has `notes`', function() {
      var method = givenRestStaticMethod({notes: 'some-notes'});
      expect(method.notes).to.equal('some-notes');
    });

    it('has `documented`', function() {
      var method = givenRestStaticMethod({documented: false});
      expect(method.documented).to.equal(false);
    });

    it('has `documented:true` by default', function() {
      var method = givenRestStaticMethod();
      expect(method.documented).to.equal(true);
    });

    describe('isReturningArray()', function() {
      it('returns true when there is single root Array arg', function() {
        var method = givenRestStaticMethod({
          returns: {root: true, type: Array},
        });
        expect(method.isReturningArray()).to.equal(true);
      });

      it('returns true when there is single root "array" arg', function() {
        var method = givenRestStaticMethod({
          returns: {root: true, type: Array},
        });
        expect(method.isReturningArray()).to.equal(true);
      });

      it('returns true when there is single root [Model] arg', function() {
        var method = givenRestStaticMethod({
          returns: {root: true, type: ['string']},
        });
        expect(method.isReturningArray()).to.equal(true);
      });

      it('returns false otherwise', function() {
        var method = givenRestStaticMethod({
          returns: {arg: 'result', type: Array},
        });
        expect(method.isReturningArray()).to.equal(false);
      });

      it('handles invalid type', function() {
        var method = givenRestStaticMethod({
          returns: {root: true},
        });
        expect(method.isReturningArray()).to.equal(false);
      });
    });

    describe('getArgByName()', function() {
      const acceptsTwoArgs = [
        {arg: 'argName1', type: String},
        {arg: 'argName2', type: String},
      ];

      it('should find the first arg', function() {
        const method = givenRestStaticMethod({accepts: acceptsTwoArgs});
        expect(method.getArgByName('argName1', ['firstArg', 'secondArg']))
          .to.equal('firstArg');
      });

      it('should not find the second arg', function() {
        const method = givenRestStaticMethod({accepts: acceptsTwoArgs});
        expect(method.getArgByName('argName2', ['firstArg', 'secondArg']))
          .to.equal('secondArg');
      });

      it('should not find argument not defined in metadata', function() {
        const method = givenRestStaticMethod({accepts: acceptsTwoArgs});
        expect(method.getArgByName('unknown-arg', ['firstArg', 'secondArg']))
          .to.equal(undefined);
      });
    });

    describe('acceptsSingleBodyArgument()', function() {
      it('returns true when the arg is a single Object from body', function() {
        var method = givenRestStaticMethod({
          accepts: {
            arg: 'data',
            type: Object,
            http: {source: 'body'},
          },
        });
        expect(method.acceptsSingleBodyArgument()).to.equal(true);
      });

      it('returns false otherwise', function() {
        var method = givenRestStaticMethod({
          accepts: {arg: 'data', type: Object},
        });
        expect(method.acceptsSingleBodyArgument()).to.equal(false);
      });
    });

    describe('getHttpMethod', function() {
      ignoreDeprecationsInThisBlock();

      it('returns POST for `all`', function() {
        var method = givenRestStaticMethod({http: {verb: 'all'}});
        expect(method.getHttpMethod()).to.equal('POST');
      });

      it('returns DELETE for `del`', function() {
        var method = givenRestStaticMethod({http: {verb: 'del'}});
        expect(method.getHttpMethod()).to.equal('DELETE');
      });

      it('returns upper-case value otherwise', function() {
        var method = givenRestStaticMethod({http: {verb: 'get'}});
        expect(method.getHttpMethod()).to.equal('GET');
      });
    });

    describe('getPath', function() {
      it('returns the path of the first route', function() {
        var method = givenRestStaticMethod({http: [
          {path: '/a-path'},
          {path: '/another-path'},
        ]});
        expect(method.getPath()).to.equal('/a-path');
      });
    });

    describe('getFullPath', function() {
      ignoreDeprecationsInThisBlock();

      it('returns class path + method path', function() {
        var method = givenRestStaticMethod(
          {http: {path: '/a-method'}},
          {http: {path: '/a-class'}}
        );

        expect(method.getFullPath()).to.equal('/a-class/a-method');
      });
    });

    describe('getEndpoints', function() {
      it('should return verb and fullPath for multiple paths', function() {
        var method = givenRestStaticMethod({http: [
          {verb: 'DEL', path: '/testMethod1'},
          {verb: 'PUT', path: '/testMethod2'},
        ]});

        var expectedEndpoints = [
          {
            fullPath: '/testClass/testMethod1',
            verb: 'DELETE',
          }, {
            fullPath: '/testClass/testMethod2',
            verb: 'PUT',
          },
        ];

        expect(method.getEndpoints()).to.eql(expectedEndpoints);
      });

      it('should return verb and fullPath for single path', function() {
        var method = givenRestStaticMethod({http: {verb: 'all'}});
        expect(method.getEndpoints()).to.eql([
          {
            verb: 'POST',
            fullPath: '/testClass/testMethod',
          },
        ]);
      });
    });

    function givenRestStaticMethod(methodConfig, classConfig) {
      var name = 'testMethod';
      methodConfig = extend({shared: true}, methodConfig);
      classConfig = extend({shared: true}, classConfig);
      remotes.testClass = extend({}, classConfig);
      var fn = remotes.testClass[name] = extend(function() {}, methodConfig);

      var sharedClass = new SharedClass('testClass', remotes.testClass);
      var restClass = new RestAdapter.RestClass(sharedClass);

      var sharedMethod = new SharedMethod(fn, name, sharedClass, methodConfig);
      return new RestAdapter.RestMethod(restClass, sharedMethod);
    }
  });

  describe('sortRoutes', function() {
    it('should sort routes based on verb & path', function() {
      var routes = [
        {route: {verb: 'get', path: '/'}},
        {route: {verb: 'get', path: '/:id'}},
        {route: {verb: 'get', path: '/findOne'}},
        {route: {verb: 'delete', path: '/'}},
        {route: {verb: 'del', path: '/:id'}},
      ];

      routes.sort(RestAdapter.sortRoutes);

      expect(routes).to.eql([
        {route: {verb: 'get', path: '/findOne'}},
        {route: {verb: 'get', path: '/:id'}},
        {route: {verb: 'get', path: '/'}},
        {route: {verb: 'del', path: '/:id'}},
        {route: {verb: 'delete', path: '/'}},
      ]);
    });

    it('should sort routes based on path accuracy', function() {
      var routes = [
        {route: {verb: 'get', path: '/'}},
        {route: {verb: 'get', path: '/:id/docs'}},
        {route: {verb: 'get', path: '/:id'}},
        {route: {verb: 'get', path: '/findOne'}},
      ];

      routes.sort(RestAdapter.sortRoutes);

      expect(routes).to.eql([
        {route: {verb: 'get', path: '/findOne'}},
        {route: {verb: 'get', path: '/:id/docs'}},
        {route: {verb: 'get', path: '/:id'}},
        {route: {verb: 'get', path: '/'}},
      ]);
    });

    it('should sort routes with common parts', function() {
      var routes = [
        {route: {verb: 'get', path: '/sum'}},
        {route: {verb: 'get', path: '/sum/1'}},
      ];

      routes.sort(RestAdapter.sortRoutes);

      expect(routes).to.eql([
        {route: {verb: 'get', path: '/sum/1'}},
        {route: {verb: 'get', path: '/sum'}},
      ]);
    });

    it('should sort routes with trailing /', function() {
      var routes = [
        {route: {verb: 'get', path: '/sum/'}},
        {route: {verb: 'get', path: '/sum/1'}},
      ];

      routes.sort(RestAdapter.sortRoutes);

      expect(routes).to.eql([
        {route: {verb: 'get', path: '/sum/1'}},
        {route: {verb: 'get', path: '/sum/'}},
      ]);
    });
  });

  describe('invoke()', function() {
    var oldInvoke = HttpInvocation.prototype.invoke;
    var remotes, req, res;

    beforeEach(function() {
      remotes = RemoteObjects.create();
      req = false;
      res = false;

      HttpInvocation.prototype.invoke = function(callback) {
        if (!this.req) {
          this.createRequest();
        }
        req = this.req;
        res = this.res = {foo: 'bar'};
        this.transformResponse(res, null, callback);
      };
    });

    afterEach(function() {
      HttpInvocation.prototype.invoke = oldInvoke;
    });

    it('should call remote hooks', function(done) {
      var beforeCalled = false;
      var afterCalled = false;
      var name = 'testClass.testMethod';

      remotes.before(name, function(ctx, next) {
        beforeCalled = true;
        next();
      });

      remotes.after(name, function(ctx, next) {
        afterCalled = true;
        next();
      });

      var restAdapter = givenRestStaticMethod({isStatic: true});
      restAdapter.connect('foo');
      restAdapter.invoke(name, [], [], function() {
        assert(beforeCalled);
        assert(afterCalled);
        done();
      });
    });

    it('should call beforeRemote hook with request object', function(done) {
      var name = 'testClass.testMethod';
      var _req;

      remotes.before(name, function(ctx, next) {
        _req = ctx.req;
        next();
      });

      var restAdapter = givenRestStaticMethod({isStatic: true});
      restAdapter.connect('foo');
      restAdapter.invoke(name, [], [], function() {
        expect(_req).to.equal(req);
        done();
      });
    });

    it('should call afterRemote hook with response object', function(done) {
      var name = 'testClass.testMethod';
      var _res;

      remotes.after(name, function(ctx, next) {
        _res = ctx.res;
        next();
      });

      var restAdapter = givenRestStaticMethod({isStatic: true});
      restAdapter.connect('foo');
      restAdapter.invoke(name, [], [], function() {
        expect(_res).to.equal(res);
        done();
      });
    });

    function givenRestStaticMethod(methodConfig, classConfig) {
      var name = 'testMethod';
      methodConfig = extend({shared: true}, methodConfig);
      classConfig = extend({shared: true}, classConfig);
      var testClass = extend({}, classConfig);
      var fn = testClass[name] = extend(function() {}, methodConfig);

      var sharedClass = new SharedClass('testClass', testClass);
      var restClass = new RestAdapter.RestClass(sharedClass);
      remotes.addClass(sharedClass);

      var sharedMethod = new SharedMethod(fn, name, sharedClass, methodConfig);
      var restMethod = new RestAdapter.RestMethod(restClass, sharedMethod);
      return new RestAdapter(remotes);
    }
  });

  describe('_getInvocationAuth()', function() {
    let remotes, restAdapter;
    beforeEach(() => {
      remotes = RemoteObjects.create({cors: false});
      restAdapter = new RestAdapter(remotes, {
        passAccessToken: true,
      });
    });

    it('should find the access token in the options from the args', () => {
      const accessToken = {id: 'def'};
      const options = {accessToken: accessToken};
      const auth = restAdapter._getInvocationAuth(options);
      expect(auth).to.deep.equal(options);
    });

    it('should find the auth from the remote', () => {
      remotes.auth = {bearer: 'zzz'};
      const auth = restAdapter._getInvocationAuth(undefined);
      expect(auth).to.deep.equal(remotes.auth);
    });

    it('should prefer global auth over invocation options', () => {
      remotes.auth = {bearer: 'zzz'};
      const accessToken = {id: 'def'};
      const options = {accessToken: accessToken};
      const auth = restAdapter._getInvocationAuth(options);
      expect(auth).to.deep.equal(remotes.auth);
    });
  });

  describe('getRestMethodByName()', function() {
    var SHARED_CLASS_NAME = 'testClass';
    var METHOD_NAME = 'testMethod';
    var FULL_NAME = SHARED_CLASS_NAME + '.' + METHOD_NAME;

    var sharedClass, restAdapter;

    beforeEach(givenSharedClassWithStaticMethod);
    beforeEach(givenConnectedRestAdapter);

    it('should find method by name', function() {
      var restMethod = restAdapter.getRestMethodByName(FULL_NAME);
      expect(restMethod).to.have.property('fullName', FULL_NAME);
    });

    it('should exclude methods disabled after the cache was built', function() {
      // Get the rest method to trigger cache rebuild
      restAdapter.getRestMethodByName(FULL_NAME);

      sharedClass.disableMethodByName(METHOD_NAME);

      var restMethod = restAdapter.getRestMethodByName(FULL_NAME);
      expect(restAdapter.getRestMethodByName(FULL_NAME)).to.equal(undefined);
    });

    it('should find methods added after the cache was built', function() {
      // Get the rest method to trigger cache rebuild
      restAdapter.getRestMethodByName(FULL_NAME);

      givenStaticSharedMethod('anotherMethod');

      var anotherFullName = SHARED_CLASS_NAME + '.anotherMethod';
      var restMethod = restAdapter.getRestMethodByName(anotherFullName);
      expect(restMethod).to.have.property('fullName', anotherFullName);
    });

    function givenSharedClassWithStaticMethod() {
      var testClass = {shared: true};
      sharedClass = new SharedClass(SHARED_CLASS_NAME, testClass);
      remotes.addClass(sharedClass);

      givenStaticSharedMethod(METHOD_NAME);
    }

    function givenStaticSharedMethod(name, config) {
      config = extend({shared: true, isStatic: true}, config);
      sharedClass.ctor[name] = extend(function() {}, config);
    }

    function givenConnectedRestAdapter() {
      restAdapter = new RestAdapter(remotes);
      restAdapter.connect('foo');
    }
  });
});

function someFunc() {
}

function ignoreDeprecationsInThisBlock() {
  before(function() {
    process.on('deprecation', NOOP);
  });

  after(function() {
    process.removeListener('deprecation', NOOP);
  });
}
