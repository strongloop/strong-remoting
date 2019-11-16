// Copyright IBM Corp. 2014,2018. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

const assert = require('assert');
const HttpInvocation = require('../lib/http-invocation');
const extend = require('util')._extend;
const inherits = require('util').inherits;
const RemoteObjects = require('../');
const RestAdapter = require('../lib/rest-adapter');
const SharedClass = require('../lib/shared-class');
const SharedMethod = require('../lib/shared-method');
const expect = require('chai').expect;
const factory = require('./helpers/shared-objects-factory.js');
function NOOP() {}

describe('RestAdapter', function() {
  let remotes;

  beforeEach(function() {
    remotes = RemoteObjects.create();
  });

  describe('getClasses()', function() {
    it('fills `name`', function() {
      remotes.exports.testClass = factory.createSharedClass();
      const classes = getRestClasses();
      expect(classes[0]).to.have.property('name', 'testClass');
    });

    it('fills `routes`', function() {
      remotes.exports.testClass = factory.createSharedClass();
      remotes.exports.testClass.http = {path: '/test-class', verb: 'any'};

      const classes = getRestClasses();

      expect(classes[0]).to.have.property('routes')
        .eql([{path: '/test-class', verb: 'any'}]);
    });

    it('fills `sharedClass`', function() {
      remotes.exports.testClass = factory.createSharedClass();
      const classes = getRestClasses();
      expect(classes[0]).to.have.property('sharedClass');
      expect(classes[0].sharedClass).to.be.an.instanceOf(SharedClass);
    });

    it('fills `ctor`', function() {
      const testClass = remotes.exports.testClass = factory.createSharedClass();
      testClass.sharedCtor.http = {path: '/shared-ctor', verb: 'all'};

      const classes = getRestClasses();

      expect(classes[0].ctor).to.have.property('routes')
        .eql([{path: '/shared-ctor', verb: 'all'}]);
    });

    it('fills static methods', function() {
      const testClass = remotes.exports.testClass = factory.createSharedClass();
      testClass.staticMethod = extend(someFunc, {shared: true});

      const methods = getRestClasses()[0].methods;

      expect(methods).to.have.length(1);
      expect(methods[0]).to.have.property('name', 'staticMethod');
      expect(methods[0]).to.have.property('fullName', 'testClass.staticMethod');
      expect(methods[0])
        .to.have.nested.property('routes[0].path', '/staticMethod');
    });

    it('fills prototype methods', function() {
      const testClass = remotes.exports.testClass = factory.createSharedClass();
      testClass.prototype.instanceMethod = extend(someFunc, {shared: true});

      const methods = getRestClasses()[0].methods;

      expect(methods).to.have.length(1);
      expect(methods[0])
        .to.have.property('fullName', 'testClass.prototype.instanceMethod');
      expect(methods[0])
        // Note: the `/id:` part is coming from testClass.sharedCtor
        .to.have.nested.property('routes[0].path', '/:id/instanceMethod');
    });

    function getRestClasses() {
      return new RestAdapter(remotes).getClasses();
    }
  });

  describe('path normalization', function() {
    it('fills `routes`', function() {
      remotes.exports.testClass = factory.createSharedClass();
      remotes.exports.testClass.http = {path: '/testClass', verb: 'any'};

      const classes = getRestClasses();

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
        const restClass = givenRestClass({http: [
          {path: '/a-path'},
          {path: '/another-path'},
        ]});
        expect(restClass.getPath()).to.equal('/a-path');
      });
    });

    function givenRestClass(config) {
      const ctor = factory.createSharedClass(config);
      remotes.testClass = ctor;
      const sharedClass = new SharedClass('testClass', ctor);
      return new RestAdapter.RestClass(sharedClass);
    }
  });

  describe('RestMethod', function() {
    const anArg = {arg: 'an-arg-name', type: String};

    it('has `accepts`', function() {
      const method = givenRestStaticMethod({accepts: anArg});
      expect(method.accepts).to.eql([anArg]);
    });

    it('has `returns`', function() {
      const method = givenRestStaticMethod({returns: anArg});
      expect(method.returns).to.eql([anArg]);
    });

    it('has `errors`', function() {
      const method = givenRestStaticMethod({errors: anArg});
      expect(method.errors).to.eql([anArg]);
    });

    it('has `description`', function() {
      const method = givenRestStaticMethod({description: 'a-desc'});
      expect(method.description).to.equal('a-desc');
    });

    it('has `notes`', function() {
      const method = givenRestStaticMethod({notes: 'some-notes'});
      expect(method.notes).to.equal('some-notes');
    });

    it('has `documented`', function() {
      const method = givenRestStaticMethod({documented: false});
      expect(method.documented).to.equal(false);
    });

    it('has `documented:true` by default', function() {
      const method = givenRestStaticMethod();
      expect(method.documented).to.equal(true);
    });

    describe('isReturningArray()', function() {
      it('returns true when there is single root Array arg', function() {
        const method = givenRestStaticMethod({
          returns: {root: true, type: Array},
        });
        expect(method.isReturningArray()).to.equal(true);
      });

      it('returns true when there is single root "array" arg', function() {
        const method = givenRestStaticMethod({
          returns: {root: true, type: Array},
        });
        expect(method.isReturningArray()).to.equal(true);
      });

      it('returns true when there is single root [Model] arg', function() {
        const method = givenRestStaticMethod({
          returns: {root: true, type: ['string']},
        });
        expect(method.isReturningArray()).to.equal(true);
      });

      it('returns false otherwise', function() {
        const method = givenRestStaticMethod({
          returns: {arg: 'result', type: Array},
        });
        expect(method.isReturningArray()).to.equal(false);
      });

      it('handles invalid type', function() {
        const method = givenRestStaticMethod({
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
        const method = givenRestStaticMethod({
          accepts: {
            arg: 'data',
            type: Object,
            http: {source: 'body'},
          },
        });
        expect(method.acceptsSingleBodyArgument()).to.equal(true);
      });

      it('returns false otherwise', function() {
        const method = givenRestStaticMethod({
          accepts: {arg: 'data', type: Object},
        });
        expect(method.acceptsSingleBodyArgument()).to.equal(false);
      });
    });

    describe('getHttpMethod', function() {
      ignoreDeprecationsInThisBlock();

      it('returns POST for `all`', function() {
        const method = givenRestStaticMethod({http: {verb: 'all'}});
        expect(method.getHttpMethod()).to.equal('POST');
      });

      it('returns DELETE for `del`', function() {
        const method = givenRestStaticMethod({http: {verb: 'del'}});
        expect(method.getHttpMethod()).to.equal('DELETE');
      });

      it('returns upper-case value otherwise', function() {
        const method = givenRestStaticMethod({http: {verb: 'get'}});
        expect(method.getHttpMethod()).to.equal('GET');
      });
    });

    describe('getPath', function() {
      it('returns the path of the first route', function() {
        const method = givenRestStaticMethod({http: [
          {path: '/a-path'},
          {path: '/another-path'},
        ]});
        expect(method.getPath()).to.equal('/a-path');
      });
    });

    describe('getFullPath', function() {
      ignoreDeprecationsInThisBlock();

      it('returns class path + method path', function() {
        const method = givenRestStaticMethod(
          {http: {path: '/a-method'}},
          {http: {path: '/a-class'}},
        );

        expect(method.getFullPath()).to.equal('/a-class/a-method');
      });
    });

    describe('getEndpoints', function() {
      it('should return verb and fullPath for multiple paths', function() {
        const method = givenRestStaticMethod({http: [
          {verb: 'DEL', path: '/testMethod1'},
          {verb: 'PUT', path: '/testMethod2'},
        ]});

        const expectedEndpoints = [
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
        const method = givenRestStaticMethod({http: {verb: 'all'}});
        expect(method.getEndpoints()).to.eql([
          {
            verb: 'POST',
            fullPath: '/testClass/testMethod',
          },
        ]);
      });
    });

    function givenRestStaticMethod(methodConfig, classConfig) {
      const name = 'testMethod';
      methodConfig = extend({shared: true}, methodConfig);
      classConfig = extend({shared: true}, classConfig);
      remotes.testClass = extend({}, classConfig);
      const fn = remotes.testClass[name] = extend(function() {}, methodConfig);

      const sharedClass = new SharedClass('testClass', remotes.testClass);
      const restClass = new RestAdapter.RestClass(sharedClass);

      const sharedMethod = new SharedMethod(fn, name, sharedClass, methodConfig);
      return new RestAdapter.RestMethod(restClass, sharedMethod);
    }
  });

  describe('sortRoutes', function() {
    it('should sort routes based on verb & path', function() {
      const routes = [
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
      const routes = [
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
      const routes = [
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
      const routes = [
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
    const oldInvoke = HttpInvocation.prototype.invoke;
    let remotes, req, res;

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
      let beforeCalled = false;
      let afterCalled = false;
      const name = 'testClass.testMethod';

      remotes.before(name, function(ctx, next) {
        beforeCalled = true;
        next();
      });

      remotes.after(name, function(ctx, next) {
        afterCalled = true;
        next();
      });

      const restAdapter = givenRestStaticMethod({isStatic: true});
      restAdapter.connect('foo');
      restAdapter.invoke(name, [], [], function() {
        assert(beforeCalled);
        assert(afterCalled);
        done();
      });
    });

    it('should call beforeRemote hook with request object', function(done) {
      const name = 'testClass.testMethod';
      let _req;

      remotes.before(name, function(ctx, next) {
        _req = ctx.req;
        next();
      });

      const restAdapter = givenRestStaticMethod({isStatic: true});
      restAdapter.connect('foo');
      restAdapter.invoke(name, [], [], function() {
        expect(_req).to.equal(req);
        done();
      });
    });

    it('should call afterRemote hook with response object', function(done) {
      const name = 'testClass.testMethod';
      let _res;

      remotes.after(name, function(ctx, next) {
        _res = ctx.res;
        next();
      });

      const restAdapter = givenRestStaticMethod({isStatic: true});
      restAdapter.connect('foo');
      restAdapter.invoke(name, [], [], function() {
        expect(_res).to.equal(res);
        done();
      });
    });

    function givenRestStaticMethod(methodConfig, classConfig) {
      const name = 'testMethod';
      methodConfig = extend({shared: true}, methodConfig);
      classConfig = extend({shared: true}, classConfig);
      const testClass = extend({}, classConfig);
      const fn = testClass[name] = extend(function() {}, methodConfig);

      const sharedClass = new SharedClass('testClass', testClass);
      const restClass = new RestAdapter.RestClass(sharedClass);
      remotes.addClass(sharedClass);

      const sharedMethod = new SharedMethod(fn, name, sharedClass, methodConfig);
      const restMethod = new RestAdapter.RestMethod(restClass, sharedMethod);
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
    const SHARED_CLASS_NAME = 'testClass';
    const METHOD_NAME = 'testMethod';
    const FULL_NAME = SHARED_CLASS_NAME + '.' + METHOD_NAME;

    let sharedClass, restAdapter;

    beforeEach(givenSharedClassWithStaticMethod);
    beforeEach(givenConnectedRestAdapter);

    it('should find method by name', function() {
      const restMethod = restAdapter.getRestMethodByName(FULL_NAME);
      expect(restMethod).to.have.property('fullName', FULL_NAME);
    });

    it('should exclude methods disabled after the cache was built', function() {
      // Get the rest method to trigger cache rebuild
      restAdapter.getRestMethodByName(FULL_NAME);

      sharedClass.disableMethodByName(METHOD_NAME);

      const restMethod = restAdapter.getRestMethodByName(FULL_NAME);
      expect(restAdapter.getRestMethodByName(FULL_NAME)).to.equal(undefined);
    });

    it('should find methods added after the cache was built', function() {
      // Get the rest method to trigger cache rebuild
      restAdapter.getRestMethodByName(FULL_NAME);

      givenStaticSharedMethod('anotherMethod');

      const anotherFullName = SHARED_CLASS_NAME + '.anotherMethod';
      const restMethod = restAdapter.getRestMethodByName(anotherFullName);
      expect(restMethod).to.have.property('fullName', anotherFullName);
    });

    function givenSharedClassWithStaticMethod() {
      const testClass = {shared: true};
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

  describe('allRoutes', function() {
    it('includes http', function() {
      const remotes = RemoteObjects.create({cors: false});
      remotes.exports.testClass = factory.createSharedClass();
      remotes.exports.testClass.http = {path: '/testClass', verb: 'any'};

      const restAdapter = new RestAdapter(remotes);
      const allRoutes = restAdapter.allRoutes();
      expect(allRoutes[0]).to.have.property('http');
    });
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
