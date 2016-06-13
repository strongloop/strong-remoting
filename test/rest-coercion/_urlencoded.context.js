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

var EMPTY_QUERY = '';

module.exports = function createUrlEncodedContext(ctx, target) {
  var TARGET_QUERY_STRING = target === 'qs';

  return extend({
    /** Send empty data, i.e. empty request body or no query string */
    EMPTY_QUERY: EMPTY_QUERY,
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
   *
   * **Example**
   *
   * ```js
   * verifyTestCases({ arg: 'arg', type: 'number' }, [
   *   [{ arg: 0 }, 0],
   *   [{ arg: 'text' }, ERROR_BAD_REQUEST]
   * ]);
   * ```
   *
   * In this scenario, we build a shared method that accepts a single "arg"
   * argument of "number" type. Then we run two test cases:
   *
   * The first one sends url-encoded data `arg=0` either in query-string
   * or request body (depending on `target` configuration set earlier)
   * and expects the argument to be set to number `0`.
   *
   * The second one sends `arg=text` and expects the request to fail
   * with HTTP status 400 Bad Request.
   */
  function verifyTestCases(argSpec, testCases) {
    testCases.forEach(function(tc) {
      var queryString = tc[0];
      var expectedValue = tc[1];

      var niceInput = queryString === EMPTY_QUERY ?
        TARGET_QUERY_STRING ? 'empty query' : 'empty form' :
        queryString;
      var niceExpectation = ctx.prettyExpectation(expectedValue);
      var testName = format('coerces %s to %s', niceInput, niceExpectation);

      it(testName, function(done) {
        ctx.runtime.currentInput = niceInput;
        testCoercion(argSpec, queryString, expectedValue, done);
      });
    });
  }

  function testCoercion(argSpec, queryString, expectedResult, done) {
    var argValue;
    var testClass = ctx.remoteObjects.exports.testClass = {
      testMethod: function(arg, cb) {
        argValue = arg;
        return cb(null, true);
      },
    };

    var source = TARGET_QUERY_STRING ? 'query' : 'form';
    extend(testClass.testMethod, {
      shared: true,
      accepts: extend(argSpec, { http: { source: source }}),
      returns: { name: 'success', type: 'boolean' },
    });

    var uri = '/testClass/testMethod';
    var chain; // eslint-disable-line one-var
    if (TARGET_QUERY_STRING) {
      uri = uri + '?' + queryString;
      chain = ctx.request.get(uri);
    } else {
      chain = ctx.request.post(uri)
        .type('form')
        .send(queryString);
    }

    chain
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        ctx.verifyResultOnResponse(err, res, argValue, expectedResult, done);
      });
  }
};
