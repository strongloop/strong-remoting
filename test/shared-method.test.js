var assert = require('assert');
var extend = require('util')._extend;
var expect = require('chai').expect;
var SharedMethod = require('../lib/shared-method');
var factory = require('./helpers/shared-objects-factory.js');

describe('SharedMethod', function() {
  describe('sharedMethod.isDelegateFor(suspect, [isStatic])', function() {

    // stub function
    function myFunction() {}

    it('checks if the given function is going to be invoked', function() {
      var mockSharedClass = {};
      var sharedMethod = new SharedMethod(myFunction, 'myName', mockSharedClass);
      assert.equal(sharedMethod.isDelegateFor(myFunction), true);
    });

    it('checks by name if a function is going to be invoked', function() {
      var mockSharedClass = { prototype: { myName: myFunction } };
      var sharedMethod = new SharedMethod(myFunction, 'myName', mockSharedClass);
      assert.equal(sharedMethod.isDelegateFor('myName', false), true);
      assert.equal(sharedMethod.isDelegateFor('myName', true), false);
      assert.equal(sharedMethod.isDelegateFor('myName'), true);
    });

    it('checks by name if static function is going to be invoked', function() {
      var mockSharedClass = { myName: myFunction };
      var options = { isStatic: true };
      var sharedMethod = new SharedMethod(myFunction, 'myName', mockSharedClass, options);
      assert.equal(sharedMethod.isDelegateFor('myName', true), true);
      assert.equal(sharedMethod.isDelegateFor('myName', false), false);
    });

    it('checks by alias if static function is going to be invoked', function() {
      var mockSharedClass = { myName: myFunction };
      var options = { isStatic: true, aliases: ['myAlias'] };
      var sharedMethod = new SharedMethod(myFunction, 'myName', mockSharedClass, options);
      assert.equal(sharedMethod.isDelegateFor('myAlias', true), true);
      assert.equal(sharedMethod.isDelegateFor('myAlias', false), false);
    });

    it('checks if the given name is a string', function() {
      var mockSharedClass = {};
      var err;
      try {
        var sharedMethod = new SharedMethod(myFunction, Number, mockSharedClass);
      } catch (e) {
        err = e;
      }
      assert(err);
    });
  });

  describe('sharedMethod.invoke', function() {
    it('returns 400 when number argument is `NaN`', function(done) {
      var method = givenSharedMethod({
        accepts: [{ arg: 'num', type: 'number' }]
      });

      method.invoke('ctx', { num: NaN }, function(err) {
        setImmediate(function() {
          expect(err).to.exist();
          expect(err.message).to.contain('num must be a number');
          expect(err.statusCode).to.equal(400);
          done();
        });
      });
    });

    it('returns 400 and doesn\'t crash with unparsable object', function(done) {
      var method = givenSharedMethod({
        accepts: [{ arg: 'obj', type: 'object' }]
      });

      method.invoke('ctx', { obj: 'test' }, function(err) {
        setImmediate(function() {
          expect(err).to.exist();
          expect(err.message).to.contain('invalid value for argument');
          expect(err.statusCode).to.equal(400);
          done();
        });
      });
    });

    function givenSharedMethod(options) {
      var aFn = function() {
        arguments[arguments.length - 1]();
      };

      var mockSharedClass = { fn: aFn };
      return new SharedMethod(aFn, 'fn', mockSharedClass, options);
    }
  });
});
