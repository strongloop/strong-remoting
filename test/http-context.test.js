// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

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
    // These are strict JSON coercion, aka no string -> type nonsense
    describe('JSON input should only coerce arrays', function() {
      it('should include a named string arg', givenJSONExpectArg({
        type: 'string',
        input: 'foobar',
        expectedValue: 'foobar'
      }));
      it('should not coerce integer strings into numbers', givenJSONExpectArg({
        type: 'number',
        input: '123456',
        expectedValue: '123456'
      }));
      it('should not coerce float strings into numbers', givenJSONExpectArg({
        type: 'number',
        input: '0.123456',
        expectedValue: '0.123456'
      }));
      it('should not coerce numbers into strings', givenJSONExpectArg({
        type: 'string',
        input: 123456,
        expectedValue: 123456
      }));
      it('should not coerce number strings preceded by 0 into numbers', givenJSONExpectArg({
        type: 'number',
        input: '000123',
        expectedValue: '000123'
      }));
      it('should not coerce null strings into null', givenJSONExpectArg({
        type: 'string',
        input: 'null',
        expectedValue: 'null'
      }));
      it('should not coerce null into the null string', givenJSONExpectArg({
        type: 'string',
        input: null,
        expectedValue: null
      }));
      it('should not coerce undefined into the undefined string', givenJSONExpectArg({
        type: 'string',
        input: undefined,
        expectedValue: undefined
      }));
      it('should not coerce into array', givenJSONExpectArg({
        type: ['string'],
        input: 123,
        expectedValue: 123
      }));
      it('should not coerce a single string into an array of strings', givenJSONExpectArg({
        type: ['string'],
        input: '123',
        expectedValue: '123'
      }));
    });

    describe('don\'t coerce arguments without a defined type (or any) in JSON', function() {
      it('should not coerce boolean strings into actual booleans', givenJSONExpectArg({
        type: 'any',
        input: 'true',
        expectedValue: 'true'
      }));
      it('should not coerce integer strings into actual numbers', givenJSONExpectArg({
        type: 'any',
        input: '123456',
        expectedValue: '123456'
      }));
      it('should not coerce float strings into actual numbers', givenJSONExpectArg({
        type: 'any',
        input: '0.123456',
        expectedValue: '0.123456'
      }));
      it('should not coerce null strings into null', givenJSONExpectArg({
        type: 'any',
        input: 'null',
        expectedValue: 'null'
      }));
    });

    describe('limited arg coercion with a defined type in formdata', function() {
      it('should coerce boolean strings into actual booleans', givenFormDataExpectArg({
        type: 'boolean',
        input: 'true',
        expectedValue: true
      }));
      it('should coerce boolean strings into actual booleans', givenFormDataExpectArg({
        type: 'boolean',
        input: 'false',
        expectedValue: false
      }));
      it('should coerce numbers into actual booleans', givenFormDataExpectArg({
        type: 'boolean',
        input: 0,
        expectedValue: false
      }));
      it('should coerce numbers into actual booleans', givenFormDataExpectArg({
        type: 'boolean',
        input: 1,
        expectedValue: true
      }));
      it('should coerce integer strings into actual numbers', givenFormDataExpectArg({
        type: 'number',
        input: '123456',
        expectedValue: 123456
      }));
      it('should coerce float strings into actual numbers', givenFormDataExpectArg({
        type: 'number',
        input: '0.123456',
        expectedValue: 0.123456
      }));
      it('should coerce null strings into false for boolean', givenFormDataExpectArg({
        type: 'boolean',
        input: 'null',
        expectedValue: false
      }));
      it('should coerce number strings preceded by 0 into numbers', givenFormDataExpectArg({
        type: 'number',
        input: '000123',
        expectedValue: 123
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
  });
});

// Tests sending JSON - should be strict conversions
function givenJSONExpectArg(options) {
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
