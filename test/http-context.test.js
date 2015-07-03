var request = require('supertest');
var HttpContext = require('../lib/http-context');
var SharedMethod = require('../lib/shared-method');
var Dynamic = require('../lib/dynamic');
var expect = require('chai').expect;

describe('HttpContext', function() {
  beforeEach(function() {
    var test = this;
  });

  describe('ctx.args', function() {
    describe('arguments with a defined type (not any)', function() {
      it('should include a named string arg', givenMethodExpectArg({
        type: 'string',
        input: 'foobar',
        expectedValue: 'foobar'
      }));
      it('should coerce integer strings into actual numbers', givenMethodExpectArg({
        type: 'number',
        input: '123456',
        expectedValue: 123456
      }));
      it('should coerce float strings into actual numbers', givenMethodExpectArg({
        type: 'number',
        input: '0.123456',
        expectedValue: 0.123456
      }));
      it('should coerce number strings preceded by 0 into numbers', givenMethodExpectArg({
        type: 'number',
        input: '000123',
        expectedValue: 123
      }));
      it('should not coerce null strings into null', givenMethodExpectArg({
        type: 'string',
        input: 'null',
        expectedValue: 'null'
      }));
      it('should coerce array types properly with non-array input', givenMethodExpectArg({
        type: ['string'],
        input: 123,
        expectedValue: ['123']
      }));
      it('should not coerce a single string into a number', givenMethodExpectArg({
        type: ['string'],
        input: '123',
        expectedValue: ['123']
      }));
    });

    describe('arguments without a defined type (or any)', function() {
      it('should coerce boolean strings into actual booleans', givenMethodExpectArg({
        type: 'any',
        input: 'true',
        expectedValue: true
      }));
      it('should coerce integer strings into actual numbers', givenMethodExpectArg({
        type: 'any',
        input: '123456',
        expectedValue: 123456
      }));
      it('should coerce float strings into actual numbers', givenMethodExpectArg({
        type: 'any',
        input: '0.123456',
        expectedValue: 0.123456
      }));
      it('should coerce null strings into null', givenMethodExpectArg({
        type: 'any',
        input: 'null',
        expectedValue: null
      }));
      it('should coerce number strings preceded by 0 into strings', givenMethodExpectArg({
        type: 'any',
        input: '000123',
        expectedValue: '000123'
      }));
    });

    describe('arguments with custom type', function() {
      Dynamic.define('CustomType', function(val) {
        return JSON.parse(val);
      });

      it('should coerce dynamic type with string prop into object', givenMethodExpectArg({
        type: 'CustomType',
        input: JSON.stringify({ stringProp: 'string' }),
        expectedValue: { stringProp: 'string' }
      }));

      it('should coerce dynamic type with int prop into object', givenMethodExpectArg({
        type: 'CustomType',
        input: JSON.stringify({ intProp: 1 }),
        expectedValue: { intProp: 1 }
      }));
    });
  });
});

function givenMethodExpectArg(options) {
  return function(done) {
    var method = new SharedMethod(noop, 'testMethod', noop, {
      accepts: [{arg: 'testArg', type: options.type}]
    });

    var app = require('express')();

    app.get('/', function(req, res) {
      var ctx = new HttpContext(req, res, method);
      try {
        expect(ctx.args.testArg).to.eql(options.expectedValue);
      } catch (e) {
        return done(e);
      }
      done();
    });

    request(app).get('/?testArg=' + options.input).end();
  };
}

function noop() {}
