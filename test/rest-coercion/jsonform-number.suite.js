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

  describe('json form - number - required', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({ arg: 'arg', type: 'number', required: true }, [
      // Valid values
      [{ arg: 0 }, 0],
      [{ arg: 1 }, 1],
      [{ arg: -1 }, -1],

      // Empty values should trigger ERROR_BAD_REQUEST
      [EMPTY_BODY, ERROR_BAD_REQUEST],
      [{ arg: null }, 0], // should be: ERROR_BAD_REQUEST
      [{ arg: '' }, 0], // should be: ERROR_BAD_REQUEST
    ]);
  });

  describe('json form - number - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({ arg: 'arg', type: 'number' }, [
      // Empty values
      [EMPTY_BODY, undefined],
      [{ arg: null }, 0], // should be: null

      // Valid values
      [{ arg: 0 }, 0],
      [{ arg: 1 }, 1],
      [{ arg: -1 }, -1],
      [{ arg: 1.2 }, 1.2],
      [{ arg: -1.2 }, -1.2],

      // Numbers larger than MAX_SAFE_INTEGER get trimmed
      [{ arg: 2343546576878989879789 }, 2.34354657687899e+21],
      [{ arg: -2343546576878989879789 }, -2.34354657687899e+21],

      // Scientific notation works
      [{ arg: 1.234e+30 }, 1.234e+30],
      [{ arg: -1.234e+30 }, -1.234e+30],

      // Number-like string values should trigger ERROR_BAD_REQUEST
      [{ arg: '0' }, 0],
      [{ arg: '1' }, 1],
      [{ arg: '-1' }, -1],
      [{ arg: '1.2' }, 1.2],
      [{ arg: '-1.2' }, -1.2],
      [{ arg: '2343546576878989879789' }, 2.34354657687899e+21],
      [{ arg: '-2343546576878989879789' }, -2.34354657687899e+21],
      [{ arg: '1.234e+30' }, 1.234e+30],
      [{ arg: '-1.234e+30' }, -1.234e+30],

      // All other non-number values should trigger ERROR_BAD_REQUEST
      [{ arg: '' }, 0],
      [{ arg: false }, 0],
      [{ arg: 'false' }, ERROR_BAD_REQUEST],
      [{ arg: true }, 1],
      [{ arg: 'true' }, ERROR_BAD_REQUEST],
      [{ arg: 'text' }, ERROR_BAD_REQUEST],
      [{ arg: [] }, 0],
      [{ arg: [1, 2] }, ERROR_BAD_REQUEST],
      [{ arg: {}}, ERROR_BAD_REQUEST],
      [{ arg: { a: true }}, ERROR_BAD_REQUEST],
    ]);
  });
};
