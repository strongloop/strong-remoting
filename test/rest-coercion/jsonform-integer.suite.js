// Copyright IBM Corp. 2016,2017. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

const jsonFormContext = require('./_jsonform.context');

module.exports = function(ctx) {
  ctx = jsonFormContext(ctx);
  const EMPTY_BODY = ctx.EMPTY_BODY;
  const ERROR_BAD_REQUEST = ctx.ERROR_BAD_REQUEST;
  const verifyTestCases = ctx.verifyTestCases;

  describe('json form - integer - required', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'arg', type: 'integer', required: true}, [
      // Valid values
      [{arg: 0}, 0],
      [{arg: 1}, 1],
      [{arg: -1}, -1],

      // Empty values should trigger ERROR_BAD_REQUEST
      [EMPTY_BODY, ERROR_BAD_REQUEST],
      [{arg: null}, ERROR_BAD_REQUEST],
      [{arg: ''}, ERROR_BAD_REQUEST],
    ]);
  });

  describe('json form - integer - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'arg', type: 'integer'}, [
      // Empty values
      [EMPTY_BODY, undefined],

      // Valid values
      [{arg: 0}, 0],
      [{arg: 1}, 1],
      [{arg: -1}, -1],

      // Integers larger than MAX_SAFE_INTEGER should trigger ERROR_BAD_REQUEST
      [{arg: 2343546576878989879789}, ERROR_BAD_REQUEST],
      [{arg: -2343546576878989879789}, ERROR_BAD_REQUEST],

      // Scientific notation works
      [{arg: 1.234e+3}, 1.234e+3],
      [{arg: -1.234e+3}, -1.234e+3],

      // Integer-like string values should trigger ERROR_BAD_REQUEST
      [{arg: '0'}, ERROR_BAD_REQUEST],
      [{arg: '1'}, ERROR_BAD_REQUEST],
      [{arg: '-1'}, ERROR_BAD_REQUEST],
      [{arg: '1.2'}, ERROR_BAD_REQUEST],
      [{arg: '-1.2'}, ERROR_BAD_REQUEST],
      [{arg: '2343546576878989879789'}, ERROR_BAD_REQUEST],
      [{arg: '-2343546576878989879789'}, ERROR_BAD_REQUEST],
      [{arg: '1.234e+30'}, ERROR_BAD_REQUEST],
      [{arg: '-1.234e+30'}, ERROR_BAD_REQUEST],

      // All other non-integer values should trigger ERROR_BAD_REQUEST
      [{arg: null}, ERROR_BAD_REQUEST],
      [{arg: 1.2}, ERROR_BAD_REQUEST],
      [{arg: -1.2}, ERROR_BAD_REQUEST],
      [{arg: ''}, ERROR_BAD_REQUEST],
      [{arg: false}, ERROR_BAD_REQUEST],
      [{arg: 'false'}, ERROR_BAD_REQUEST],
      [{arg: true}, ERROR_BAD_REQUEST],
      [{arg: 'true'}, ERROR_BAD_REQUEST],
      [{arg: 'text'}, ERROR_BAD_REQUEST],
      [{arg: []}, ERROR_BAD_REQUEST],
      [{arg: [1, 2]}, ERROR_BAD_REQUEST],
      [{arg: {}}, ERROR_BAD_REQUEST],
      [{arg: {a: true}}, ERROR_BAD_REQUEST],
    ]);
  });
};
