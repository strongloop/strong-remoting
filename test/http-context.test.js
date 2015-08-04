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
      it('should coerce numbers into strings', givenMethodExpectArg({
        type: 'string',
        input: 123456,
        expectedValue: '123456'
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
      it('should not coerce null into the null string', givenMethodExpectArg({
        type: 'string',
        input: null,
        expectedValue: null
      }));
      it('should not coerce undefined into the undefined string', givenMethodExpectArg({
        type: 'string',
        input: undefined,
        expectedValue: undefined
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

    describe('don\'t coerce arguments without a defined type (or any) in JSON', function() {
      it('should not coerce boolean strings into actual booleans', givenMethodExpectArg({
        type: 'any',
        input: 'true',
        expectedValue: 'true'
      }));
      it('should not coerce integer strings into actual numbers', givenMethodExpectArg({
        type: 'any',
        input: '123456',
        expectedValue: '123456'
      }));
      it('should not coerce float strings into actual numbers', givenMethodExpectArg({
        type: 'any',
        input: '0.123456',
        expectedValue: '0.123456'
      }));
      it('should not coerce null strings into null', givenMethodExpectArg({
        type: 'any',
        input: 'null',
        expectedValue: 'null'
      }));
    });

    describe('coerce arguments without a defined type (or any) in formdata', function() {
      it('should coerce boolean strings into actual booleans', givenFormDataExpectArg({
        type: 'any',
        input: 'true',
        expectedValue: true
      }));
      it('should coerce integer strings into actual numbers', givenFormDataExpectArg({
        type: 'any',
        input: '123456',
        expectedValue: 123456
      }));
      it('should coerce float strings into actual numbers', givenFormDataExpectArg({
        type: 'any',
        input: '0.123456',
        expectedValue: 0.123456
      }));
      it('should coerce null strings into null', givenFormDataExpectArg({
        type: 'any',
        input: 'null',
        expectedValue: null
      }));
      it('should coerce number strings preceded by 0 into strings', givenFormDataExpectArg({
        type: 'any',
        input: '000123',
        expectedValue: '000123'
      }));
    });

    describe('coerce arguments without a defined type (or any) in QS', function() {
      it('should coerce boolean strings into actual booleans', givenQSExpectArg({
        type: 'any',
        input: 'true',
        expectedValue: true
      }));
      it('should coerce integer strings into actual numbers', givenQSExpectArg({
        type: 'any',
        input: '123456',
        expectedValue: 123456
      }));
      it('should coerce float strings into actual numbers', givenQSExpectArg({
        type: 'any',
        input: '0.123456',
        expectedValue: 0.123456
      }));
      it('should coerce null strings into null', givenQSExpectArg({
        type: 'any',
        input: 'null',
        expectedValue: null
      }));
      it('should coerce number strings preceded by 0 into strings', givenQSExpectArg({
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

// Tests sending JSON - should be strict conversions
function givenMethodExpectArg(options) {
  return function(done) {
    var method = new SharedMethod(noop, 'testMethod', noop, {
      accepts: [{arg: 'testArg', type: options.type}]
    });

    var app = require('express')();
    app.use(require('body-parser').json());

    app.post('/', function(req, res) {
      var ctx = new HttpContext(req, res, method);
      try {
        expect(ctx.args.testArg).to.eql(options.expectedValue);
      } catch (e) {
        return done(e);
      }
      done();
    });

    request(app).post('/')
      .type('json')
      .send({testArg: options.input})
      .end();
  };
}

// Tests sending via formdata - should be sloppy conversions
function givenFormDataExpectArg(options) {
  return function(done) {
    var method = new SharedMethod(noop, 'testMethod', noop, {
      accepts: [{arg: 'testArg', type: options.type}]
    });

    var app = require('express')();
    app.use(require('body-parser').urlencoded({extended: false}));

    app.post('/', function(req, res) {
      var ctx = new HttpContext(req, res, method);
      try {
        expect(ctx.args.testArg).to.eql(options.expectedValue);
      } catch (e) {
        return done(e);
      }
      done();
    });

    request(app).post('/')
      .type('form')
      .send({testArg: options.input})
      .end();
  };
}

// Tests sending via querystring - should be sloppy conversions
function givenQSExpectArg(options) {
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
