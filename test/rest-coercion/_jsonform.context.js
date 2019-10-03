// Copyright IBM Corp. 2016,2017. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

const debug = require('debug')('test');
const expect = require('chai').expect;
const util = require('util');
const format = util.format;
const extend = util._extend;

const EMPTY_BODY = {};

module.exports = function createJsonBodyContext(ctx) {
  return extend(Object.create(ctx), {
    /** Send a request with an empty body (that is still valid JSON) */
    EMPTY_BODY: EMPTY_BODY,
    verifyTestCases: verifyTestCases,
  });

  /**
   * Verify a set of test-cases for a given argument specification
   * (remoting definition).
   *
   * @param {Object} argSpec Argument definition, note that `http`
   *   settings are injected automatically.
   * @param {Array} testCases List of test cases to run & verify.
   *   A test-case is a tuple [request-body, expected-argument-value]
   *
   * **Example**
   *
   * ```js
   * verifyTestCases({ arg: 'arg', type: 'number' }, [
   *   [{ arg: null }, 0],
   *   [{ arg: 'text' }, ERROR_BAD_REQUEST]
   * ]);
   * ```
   *
   * In this scenario, we build a shared method that accepts a single "arg"
   * argument of "number" type. Then we run two test cases:
   *
   * The first one sends JSON request body `{ "arg": null }` and expects
   * the argument to be set to number `0`.
   *
   * The second one sends JSON request body `{ "arg": 'text' }` and expects
   * the request to fail with HTTP status 400 Bad Request.
   */
  function verifyTestCases(argSpec, testCases) {
    testCases.forEach(function(tc) {
      const requestBody = tc[0];
      const expectedValue = tc[1];

      const niceInput = requestBody === EMPTY_BODY ?
        'empty body' : JSON.stringify(requestBody);
      const niceExpectation = ctx.prettyExpectation(expectedValue);
      const testName = format('coerces %s to %s', niceInput, niceExpectation);

      it(testName, function(done) {
        ctx.runtime.currentInput = niceInput;
        testCoercion(argSpec, requestBody, expectedValue, done);
      });
    });
  }

  function testCoercion(argSpec, requestBody, expectedResult, done) {
    let argValue;
    const testClass = ctx.remoteObjects.exports.testClass = {
      testMethod: function(arg, cb) {
        argValue = arg;
        return cb(null, true);
      },
    };

    extend(testClass.testMethod, {
      shared: true,
      accepts: extend(argSpec, {http: {source: 'form'}}),
      returns: {name: 'success', type: 'boolean'},
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
