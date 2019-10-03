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

  describe('json form - string - required', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'arg', type: 'string', required: true}, [
      // Valid values
      [{arg: 'null'}, 'null'],
      [{arg: 'text'}, 'text'],

      // Empty values should trigger ERROR_BAD_REQUEST
      [EMPTY_BODY, ERROR_BAD_REQUEST],
      [{arg: ''}, ERROR_BAD_REQUEST],
      [{arg: null}, ERROR_BAD_REQUEST],
    ]);
  });

  describe('json form - string - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'arg', type: 'string'}, [
      // Empty values
      [EMPTY_BODY, undefined],
      [{arg: ''}, ''],

      // Valid values
      [{arg: 'text'}, 'text'],

      // Verify that deep coercion is not triggered
      // and types specified in JSON are preserved
      [{arg: 'undefined'}, 'undefined'],
      [{arg: 'null'}, 'null'],
      [{arg: '0'}, '0'],
      [{arg: '1'}, '1'],
      [{arg: '-1'}, '-1'],
      [{arg: '1.2'}, '1.2'],
      [{arg: '-1.2'}, '-1.2'],
      [{arg: 'false'}, 'false'],
      [{arg: 'true'}, 'true'],

      // Invalid values should trigger ERROR_BAD_REQUEST
      [{arg: null}, ERROR_BAD_REQUEST],
      [{arg: false}, ERROR_BAD_REQUEST],
      [{arg: true}, ERROR_BAD_REQUEST],
      [{arg: 0}, ERROR_BAD_REQUEST],
      [{arg: 1}, ERROR_BAD_REQUEST],
      [{arg: -1}, ERROR_BAD_REQUEST],
      [{arg: 1.2}, ERROR_BAD_REQUEST],
      [{arg: -1.2}, ERROR_BAD_REQUEST],
      [{arg: []}, ERROR_BAD_REQUEST],
      [{arg: {}}, ERROR_BAD_REQUEST],
    ]);
  });
};
