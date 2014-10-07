var assert = require('assert');
var HttpInvocation = require('../lib/http-invocation');
var SharedMethod = require('../lib/shared-method');
var extend = require('util')._extend;
var expect = require('chai').expect;

describe('HttpInvocation', function() {
  describe('namedArgs', function() {
    
    function expectNamedArgs(accepts, inputArgs, expectedNamedArgs) {
      var method = givenSharedStaticMethod({
        accepts: accepts
      });
      var inv = new HttpInvocation(method, null, inputArgs);
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
          type: 'number'
        });
        expect(acceptable).to.equal(true);
      });

      it('should always accept args when type is any', function() {
        var acceptable = HttpInvocation.isAcceptable(2, {
          arg: 'bar',
          type: 'any'
        });
        expect(acceptable).to.equal(true);
      });

      it('should always accept args when type is complex', function() {
        var acceptable = HttpInvocation.isAcceptable({}, {
          arg: 'bar',
          type: 'MyComplexType'
        });
        expect(acceptable).to.equal(true);
      });

      it('should accept null arg when type is complex', function() {
        var acceptable = HttpInvocation.isAcceptable(null, {
          arg: 'bar',
          type: 'MyComplexType'
        });
        expect(acceptable).to.equal(true);
      });
    });
  });
});

function givenSharedStaticMethod(fn, config) {
  if (typeof fn === 'object' && config === undefined) {
    config = fn;
    fn = null;
  }
  fn = fn || function(cb) { cb(); };

  var testClass = { testMethod: fn };
  config = extend({ shared: true }, config);
  extend(testClass.testMethod, config);
  return SharedMethod.fromFunction(fn, 'testStaticMethodName', null, true);
}
