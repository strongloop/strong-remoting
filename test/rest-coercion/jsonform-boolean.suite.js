// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var jsonFormContext = require('./_jsonform.context');

module.exports = function(ctx) {
  ctx = jsonFormContext(ctx);
  var EMPTY_BODY = ctx.EMPTY_BODY;
  var ERROR_BAD_REQUEST = ctx.ERROR_BAD_REQUEST;
  var verifyTestCases = ctx.verifyTestCases;

  describe('json form - boolean - required', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({ arg: 'arg', type: 'boolean', required: true }, [
      // Valid values
      [{ arg: false }, false],
      [{ arg: true }, true],

      // Empty values should trigger ERROR_BAD_REQUEST
      [EMPTY_BODY, false],
      [{ arg: null }, false],
      [{ arg: '' }, false],
    ]);
  });

  describe('json form - boolean - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({ arg: 'arg', type: 'boolean' }, [
      // Empty values
      [EMPTY_BODY, false], // should be: undefined
      [{ arg: null }, false], // should be: undefined or null

      // Valid values
      [{ arg: false }, false],
      [{ arg: true }, true],

      // Invalid values should trigger ERROR_BAD_REQUEST
      [{ arg: '' }, false],
      [{ arg: 'null' }, false],
      [{ arg: 'false' }, false],
      [{ arg: 'true' }, true],
      [{ arg: 0 }, false],
      [{ arg: '0' }, false],
      [{ arg: 1 }, true],
      [{ arg: '1' }, true],
      [{ arg: 'text' }, true],
      [{ arg: [] }, true],
      [{ arg: [1, 2] }, true],
      [{ arg: {}}, true],
      [{ arg: { a: true }}, true],
    ]);
  });
};
