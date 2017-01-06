// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var assert = require('assert');
var HttpInvocation = require('../lib/http-invocation');
var SharedMethod = require('../lib/shared-method');
var extend = require('util')._extend;
var expect = require('chai').expect;
var TypeRegistry = require('../lib/type-registry');

describe('HttpInvocation', function() {
  describe('namedArgs', function() {
    function expectNamedArgs(accepts, inputArgs, expectedNamedArgs) {
      var method = givenSharedStaticMethod({
        accepts: accepts,
      });
      var inv = givenInvocation(method, {args: inputArgs});
      expect(inv.namedArgs).to.deep.equal(expectedNamedArgs);
    }

    it('should correctly name a single arg', function() {
      expectNamedArgs(
        [{arg: 'a', type: 'number'}],
        [1],
        {a: 1}
      );
    });

    it('should correctly name multiple args', function() {
      expectNamedArgs(
        [{arg: 'a', type: 'number'}, {arg: 'str', type: 'string'}],
        [1, 'foo'],
        {a: 1, str: 'foo'}
      );
    });

    it('should correctly name multiple args when a partial set is provided', function() {
      expectNamedArgs(
        [{arg: 'a', type: 'number'}, {arg: 'str', type: 'string'}],
        [1],
        {a: 1}
      );
    });

    describe('HttpContext.isAcceptable()', function() {
      it('should accept an acceptable argument', function() {
        var acceptable = HttpInvocation.isAcceptable(2, {
          arg: 'foo',
          type: 'number',
        });
        expect(acceptable).to.equal(true);
      });

      it('should always accept args when type is any', function() {
        var acceptable = HttpInvocation.isAcceptable(2, {
          arg: 'bar',
          type: 'any',
        });
        expect(acceptable).to.equal(true);
      });

      it('should always accept args when type is complex', function() {
        var acceptable = HttpInvocation.isAcceptable({}, {
          arg: 'bar',
          type: 'MyComplexType',
        });
        expect(acceptable).to.equal(true);
      });

      it('should accept null arg when type is complex', function() {
        var acceptable = HttpInvocation.isAcceptable(null, {
          arg: 'bar',
          type: 'MyComplexType',
        });
        expect(acceptable).to.equal(true);
      });
    });
  });

  describe('transformResponse', function() {
    it('should return a single instance of TestClass', function(done) {
      transformReturnType({
        arg: 'data',
        type: 'bar',
        root: true,
      }, 'bar', function(data) {
        return data ? new TestClass(data) : data;
      }, {
        body: {foo: 'bar'},
      }, function(err, inst) {
        if (err) return done(err);
        if (inst.error) return done(inst.error);

        expect(inst).to.be.instanceOf(TestClass);
        expect(inst.foo).to.equal('bar');
        done();
      });

      function TestClass(data) {
        this.foo = data.foo;
      }
    });

    it('should return an array of TestClass instances', function(done) {
      transformReturnType({
        arg: 'data',
        type: ['bar'],
        root: true,
      }, 'bar', function(data) {
        return data ? new TestClass(data) : data;
      }, {
        body: [
          {foo: 'bar'},
          {foo: 'grok'},
        ],
      }, function(err, insts) {
        if (err) return done(err);
        if (insts.error) return done(insts.error);

        expect(insts).to.be.an('array');
        expect(insts[0]).to.be.instanceOf(TestClass);
        expect(insts[1]).to.be.instanceOf(TestClass);
        expect(insts[0].foo).to.equal('bar');
        expect(insts[1].foo).to.equal('grok');
        done();
      });

      function TestClass(data) {
        this.foo = data.foo;
      }
    });

    it('should forward all error properties', function(done) {
      var method = givenSharedStaticMethod({});
      var inv = givenInvocation(method);
      var res = {
        statusCode: 555,
        body: {
          error: {
            name: 'CustomError',
            message: 'Custom error message',
            statusCode: 555,
            details: {
              key: 'value',
            },
            extra: 'extra value',
          },
        },
      };

      inv.transformResponse(res, res.body, function(err) {
        if (!err)
          return done(new Error('transformResponse should have failed.'));

        expect(err).to.have.property('name', 'CustomError');
        expect(err).to.have.property('message', 'Custom error message');
        expect(err).to.have.property('statusCode', 555);
        expect(err).to.have.property('details').eql({key: 'value'});
        expect(err).to.have.property('extra', 'extra value');
        done();
      });
    });

    it('should forward statusCode and non-object error response', function(done) {
      var method = givenSharedStaticMethod({});
      var inv = givenInvocation(method);
      var res = {
        statusCode: 555,
        body: 'error body',
      };

      inv.transformResponse(res, res.body, function(err) {
        if (!err)
          return done(new Error('transformResponse should have failed.'));

        expect(err).to.have.property('statusCode', 555);
        expect(err).to.have.property('details', 'error body');
        done();
      });
    });

    function transformReturnType(returns, typeName, typeFactoryFn, res, cb) {
      var method = givenSharedStaticMethod({returns: returns});

      var typeRegistry = new TypeRegistry();
      typeRegistry.registerObjectType(typeName, typeFactoryFn);

      var inv = givenInvocation(method, {typeRegistry: typeRegistry});
      var body = res.body || {};

      inv.transformResponse(res, body, cb);
    }
  });

  describe('createRequest', function() {
    it('creates a simple request', function() {
      var inv = givenInvocationForEndpoint(null, []);
      var expectedReq = {method: 'GET',
        url: 'http://base/testModel/testMethod',
        protocol: 'http:',
        json: true,
      };
      expect(inv.createRequest()).to.eql(expectedReq);
    });

    it('makes primitive type arguments as query params', function() {
      var accepts = [
        {arg: 'a', type: 'number'},
        {arg: 'b', type: 'string'},
      ];
      var aValue = 2;
      var bValue = 'foo';
      var inv = givenInvocationForEndpoint(accepts, [aValue, bValue]);
      var expectedReq = {method: 'GET',
        url: 'http://base/testModel/testMethod?a=2&b=foo',
        protocol: 'http:',
        json: true,
      };
      expect(inv.createRequest()).to.eql(expectedReq);
    });

    it('makes an array argument as a query param', function() {
      var accepts = [
        {arg: 'a', type: 'object'},
      ];
      var aValue = [1, 2, 3];
      var inv = givenInvocationForEndpoint(accepts, [aValue]);
      var expectedReq = {method: 'GET',
        url: 'http://base/testModel/testMethod?a=' + encodeURIComponent('[1,2,3]'),
        protocol: 'http:',
        json: true,
      };
      expect(inv.createRequest()).to.eql(expectedReq);
    });

    it('keeps an empty array as a query param', function() {
      var accepts = [
        {arg: 'a', type: 'object'},
      ];
      var aValue = [];
      var inv = givenInvocationForEndpoint(accepts, [aValue]);
      var expectedReq = {method: 'GET',
        url: 'http://base/testModel/testMethod?a=' + encodeURIComponent('[]'),
        protocol: 'http:',
        json: true,
      };
      expect(inv.createRequest()).to.eql(expectedReq);
    });

    it('keeps an empty array as a body param for a POST request', function() {
      var accepts = [
        {arg: 'a', type: 'object'},
      ];
      var aValue = [];
      var inv = givenInvocationForEndpoint(accepts, [aValue], 'POST');
      var expectedReq = {method: 'POST',
        url: 'http://base/testModel/testMethod',
        protocol: 'http:',
        json: true,
        body: {
          a: [],
        },
      };
      expect(inv.createRequest()).to.eql(expectedReq);
    });

    it('handles a loopback filter as a query param', function() {
      var accepts = [
        {arg: 'filter', type: 'object'},
      ];
      var filter = {
        where: {
          id: {
            inq: [1, 2],
          },
          typeId: {
            inq: [],
          },
        },
        include: ['related'],
      };
      var inv = givenInvocationForEndpoint(accepts, [filter]);
      var expectedFilter =
        '{"where":{"id":{"inq":[1,2]},"typeId":{"inq":[]}},"include":["related"]}';
      var expectedReq = {method: 'GET',
        url: 'http://base/testModel/testMethod?filter=' +
          encodeURIComponent(expectedFilter),
        protocol: 'http:',
        json: true,
      };
      expect(inv.createRequest()).to.eql(expectedReq);
    });
  });

  it('handles a loopback filter as a body param for a POST request', function() {
    var accepts = [
      {arg: 'filter', type: 'object'},
    ];
    var filter = {
      where: {
        id: {
          inq: [1, 2],
        },
        typeId: {
          inq: [],
        },
      },
      include: ['related'],
    };
    var inv = givenInvocationForEndpoint(accepts, [filter], 'POST');
    var expectedReq = {method: 'POST',
      url: 'http://base/testModel/testMethod',
      protocol: 'http:',
      json: true,
      body: {
        filter: filter,
      },
    };
    expect(inv.createRequest()).to.eql(expectedReq);
  });
});

function givenSharedStaticMethod(fn, config) {
  if (typeof fn === 'object' && config === undefined) {
    config = fn;
    fn = null;
  }
  fn = fn || function(cb) { cb(); };

  var testClass = {testMethod: fn};
  config = extend({shared: true}, config);
  extend(testClass.testMethod, config);
  return SharedMethod.fromFunction(fn, 'testStaticMethodName', null, true);
}

function givenInvocation(method, params) {
  params = params || {};
  return new HttpInvocation(method,
      params.ctorArgs,
      params.args,
      params.baseUrl,
      params.auth,
      params.typeRegistry || new TypeRegistry());
}

function givenInvocationForEndpoint(accepts, args, verb) {
  var method = givenSharedStaticMethod({
    accepts: accepts,
  });
  method.getEndpoints = function() {
    return [createEndpoint({verb: verb || 'GET'})];
  };
  return givenInvocation(method, {ctorArgs: [], args: args, baseUrl: 'http://base'});
}

function createEndpoint(config) {
  config = config || {};
  return {
    verb: config.verb || 'GET',
    fullPath: config.fullPath || '/testModel/testMethod',
  };
}
