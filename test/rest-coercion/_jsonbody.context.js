// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var debug = require('debug')('test');
var expect = require('chai').expect;
var util = require('util');
var format = util.format;
var extend = util._extend;

module.exports = function createJsonBodyContext(ctx) {
  return extend({
    verifyTestCases: verifyTestCases,
  }, ctx);

  /**
   * Verify a set of test-cases for a given argument specification
   * (remoting definition).
   *
   * @param {Object} argSpec Argument definition, note that `http`
   *   settings are injected automatically.
   * @param {Array} testCases List of test cases to run & verify.
   *   A test-case is a tuple [request-body, expected-argument-value]
   *   The second item is optional, meaning the response should be the same
   *   as the request.
   *
   * **Example**
   *
   * ```js
   * verifyTestCases({ arg: 'name', type: 'any' }, [
   *   [{ txt: null }],
   *   [{ num: 1}, ERROR_BAD_REQUEST]
   * ]);
   * ```
   *
   * In this scenario, we build a shared method that accepts a single "name"
   * argument of "any" type. Then we run two test cases:
   *
   * The first one sends JSON request body `{ "txt": null }` and expects
   * the argument to be set to `{ arg: null }` (the same value).
   *
   * The second one sends JSON request body `{ "num": 1 }` and expects
   * the request to fail with HTTP status 400 Bad Request.
   */
  function verifyTestCases(argSpec, testCases) {
    testCases.forEach(function(tc) {
      var requestBody = tc[0];
      var expectedValue = tc[1];
      if (tc.length < 2)
        expectedValue = requestBody;

      // supertests sends string data verbatim
      var niceInput = typeof requestBody === 'string' ?
        requestBody : JSON.stringify(requestBody);
      var niceExpectation = ctx.prettyExpectation(expectedValue);
      var testName = format('coerces %s to %s', niceInput, niceExpectation);

      it(testName, function(done) {
        ctx.runtime.currentInput = niceInput;
        testCoercion(argSpec, requestBody, expectedValue, done);
      });
    });
  }

  function testCoercion(argSpec, requestBody, expectedResult, done) {
    var argValue;
    var testClass = ctx.remoteObjects.exports.testClass = {
      testMethod: function(arg, cb) {
        argValue = arg;
        return cb(null, true);
      },
    };

    extend(testClass.testMethod, {
      shared: true,
      accepts: extend(argSpec, { http: { source: 'body' }}),
      returns: { name: 'success', type: 'boolean' },
    });

    ctx.request.get('/testClass/testMethod')
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .send(requestBody)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        ctx.verifyResultOnResponse(err, res, argValue, expectedResult, done);
      });
  }
};
