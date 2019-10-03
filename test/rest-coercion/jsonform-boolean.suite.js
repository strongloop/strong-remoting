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

  describe('json form - boolean - required', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'arg', type: 'boolean', required: true}, [
      // Valid values
      [{arg: false}, false],
      [{arg: true}, true],

      // Empty values should trigger ERROR_BAD_REQUEST
      [EMPTY_BODY, ERROR_BAD_REQUEST],
      [{arg: null}, ERROR_BAD_REQUEST],
      [{arg: ''}, ERROR_BAD_REQUEST],
    ]);
  });

  describe('json form - boolean - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'arg', type: 'boolean'}, [
      // Empty values
      [EMPTY_BODY, undefined],

      // Valid values
      [{arg: false}, false],
      [{arg: true}, true],

      // Invalid values should trigger ERROR_BAD_REQUEST
      [{arg: null}, ERROR_BAD_REQUEST],
      [{arg: ''}, ERROR_BAD_REQUEST],
      [{arg: 'null'}, ERROR_BAD_REQUEST],
      [{arg: 'false'}, ERROR_BAD_REQUEST],
      [{arg: 'true'}, ERROR_BAD_REQUEST],
      [{arg: 0}, ERROR_BAD_REQUEST],
      [{arg: '0'}, ERROR_BAD_REQUEST],
      [{arg: 1}, ERROR_BAD_REQUEST],
      [{arg: '1'}, ERROR_BAD_REQUEST],
      [{arg: 'text'}, ERROR_BAD_REQUEST],
      [{arg: []}, ERROR_BAD_REQUEST],
      [{arg: [1, 2]}, ERROR_BAD_REQUEST],
      [{arg: {}}, ERROR_BAD_REQUEST],
      [{arg: {a: true}}, ERROR_BAD_REQUEST],
    ]);
  });
};
