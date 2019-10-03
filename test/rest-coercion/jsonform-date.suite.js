// Copyright IBM Corp. 2016,2017. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

const jsonFormContext = require('./_jsonform.context');

const INVALID_DATE = new Date(NaN);

module.exports = function(ctx) {
  ctx = jsonFormContext(ctx);
  const EMPTY_BODY = ctx.EMPTY_BODY;
  const ERROR_BAD_REQUEST = ctx.ERROR_BAD_REQUEST;
  const verifyTestCases = ctx.verifyTestCases;

  describe('json form - date - required', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'arg', type: 'date', required: true}, [
      // Valid values
      [{arg: 0}, new Date(0)],
      [{arg: '0'}, new Date('0')],
      [{arg: '2016-05-19T13:28:51.299Z'},
        new Date('2016-05-19T13:28:51.299Z')],

      // Empty values should trigger ERROR_BAD_REQUEST
      [EMPTY_BODY, ERROR_BAD_REQUEST],
      [{arg: null}, ERROR_BAD_REQUEST],
      [{arg: ''}, ERROR_BAD_REQUEST],
    ]);
  });

  describe('json form - date - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'arg', type: 'date'}, [
      // Empty cases
      [EMPTY_BODY, undefined],

      // Valid values - ISO format
      [{arg: '2016-05-19T13:28:51.299Z'}, new Date('2016-05-19T13:28:51.299Z')],
      [{arg: '2016-05-19'}, new Date('2016-05-19')],
      [{arg: 'Thu May 19 2016 15:28:51 GMT 0200 (CEST)'},
        new Date('2016-05-19T15:28:51.000Z')],

      // Valid values - milliseconds from Unix Epoch
      [{arg: 0}, new Date(0)],
      [{arg: 1}, new Date(1)],
      [{arg: -1}, new Date(-1)],
      [{arg: 1.2}, new Date(1.2)],
      [{arg: -1.2}, new Date(-1.2)],

      // Valid values - numeric strings
      [{arg: '0'}, new Date('0')],
      [{arg: '1'}, new Date('1')],
      [{arg: '-1'}, new Date('-1')],
      [{arg: '1.2'}, new Date('1.2')],
      [{arg: '-1.2'}, new Date('-1.2')],

      // Invalid values should trigger ERROR_BAD_REQUEST
      [{arg: null}, ERROR_BAD_REQUEST],
      [{arg: ''}, ERROR_BAD_REQUEST],
      [{arg: 'null'}, ERROR_BAD_REQUEST],
      [{arg: false}, ERROR_BAD_REQUEST],
      [{arg: 'false'}, ERROR_BAD_REQUEST],
      [{arg: true}, ERROR_BAD_REQUEST],
      [{arg: 'true'}, ERROR_BAD_REQUEST],
      [{arg: 'text'}, ERROR_BAD_REQUEST],
      [{arg: []}, ERROR_BAD_REQUEST],
      [{arg: {}}, ERROR_BAD_REQUEST],

      // Numbers larger than MAX_SAFE_INTEGER - should cause ERROR_BAD_REQUEST
      [{arg: 2343546576878989879789}, ERROR_BAD_REQUEST],
      [{arg: -2343546576878989879789}, ERROR_BAD_REQUEST],
      // Scientific notation - should cause ERROR_BAD_REQUEST
      [{arg: 1.234e+30}, ERROR_BAD_REQUEST],
      [{arg: -1.234e+30}, ERROR_BAD_REQUEST],
    ]);
  });
};
