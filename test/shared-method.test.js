var extend = require('util')._extend;
var expect = require('chai').expect;
var SharedMethod = require('../lib/shared-method');
var factory = require('./helpers/shared-objects-factory.js');

describe('SharedMethod', function() {
  describe('sharedMethod.willInvoke(suspect, [isStatic])', function () {
    it('check if the given function is going to be invoked', function () {
      var mockSharedClass = {};
      var sharedMethod = new SharedMethod(myFunction, 'myName', mockSharedClass);
      assert.equal(sharedMethod.willInvoke(myFunction), true);

      function myFunction() {}
    });
    it('check by name if function is going to be invoked', function () {
      var mockSharedClass = {prototype: {myName: myFunction}};
      var sharedMethod = new SharedMethod(myFunction, 'myName', mockSharedClass);
      assert.equal(sharedMethod.willInvoke('myName', false), true);
      assert.equal(sharedMethod.willInvoke('myName'), true);

      function myFunction() {}
    });
    it('check by name if static function is going to be invoked', function () {
      var mockSharedClass = {myName: myFunction};
      var options = {isStatic: true};
      var sharedMethod = new SharedMethod(myFunction, 'myName', mockSharedClass, options);
      assert.equal(sharedMethod.willInvoke('myName', true), true);

      function myFunction() {}
    });
  });
});

