// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var jsonFormContext = require('./_jsonform.context');

var INVALID_DATE = new Date(NaN);

module.exports = function(ctx) {
  ctx = jsonFormContext(ctx);
  var EMPTY_BODY = ctx.EMPTY_BODY;
  var ERROR_BAD_REQUEST = ctx.ERROR_BAD_REQUEST;
  var verifyTestCases = ctx.verifyTestCases;

  describe('json form - date - required', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({ arg: 'arg', type: 'date', required: true }, [
      // Valid values
      [{ arg: 0 }, new Date(0)],
      [{ arg: '0' }, new Date('0')],
      [{ arg: '2016-05-19T13:28:51.299Z' },
        new Date('2016-05-19T13:28:51.299Z')],

      // Empty values should trigger ERROR_BAD_REQUEST
      [EMPTY_BODY, ERROR_BAD_REQUEST],
      [{ arg: null }, new Date(0)], // should be: ERROR_BAD_REQUEST
      [{ arg: '' }, INVALID_DATE], // should be: ERROR_BAD_REQUEST
    ]);
  });

  describe('json form - date - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({ arg: 'arg', type: 'date' }, [
      // Empty cases
      [EMPTY_BODY, undefined], // should be: undefined
      [{ arg: null }, new Date(0)], // should be: null

      // Valid values - ISO format
      [{ arg: '2016-05-19T13:28:51.299Z' }, new Date('2016-05-19T13:28:51.299Z')],
      [{ arg: '2016-05-19' }, new Date('2016-05-19')],
      [{ arg: 'Thu May 19 2016 15:28:51 GMT 0200 (CEST)' },
        new Date('2016-05-19T15:28:51.000Z')],

      // Valid values - milliseconds from Unix Epoch
      [{ arg: 0 }, new Date(0)],
      [{ arg: 1 }, new Date(1)],
      [{ arg: -1 }, new Date(-1)],
      [{ arg: 1.2 }, new Date(1.2)],
      [{ arg: -1.2 }, new Date(-1.2)],

      // Valid values - numeric strings
      [{ arg: '0' }, new Date('0')],
      [{ arg: '1' }, new Date('1')],
      [{ arg: '-1' }, new Date('-1')],
      [{ arg: '1.2' }, new Date('1.2')],
      [{ arg: '-1.2' }, new Date('-1.2')],

      // Invalid values should trigger ERROR_BAD_REQUEST
      [{ arg: '' }, INVALID_DATE], // should be: ERROR_BAD_REQUEST
      [{ arg: 'null' }, INVALID_DATE], // should be: ERROR_BAD_REQUEST
      [{ arg: false }, new Date(0)], // should be: ERROR_BAD_REQUEST
      [{ arg: 'false' }, INVALID_DATE], // should be: ERROR_BAD_REQUEST
      [{ arg: true }, new Date(1)], // should be: ERROR_BAD_REQUEST
      [{ arg: 'true' }, INVALID_DATE], // should be: ERROR_BAD_REQUEST
      [{ arg: 'text' }, INVALID_DATE], // should be: ERROR_BAD_REQUEST
      [{ arg: [] }, INVALID_DATE], // should be: ERROR_BAD_REQUEST
      [{ arg: {}}, INVALID_DATE], // should be: ERROR_BAD_REQUEST
      // Numbers larger than MAX_SAFE_INTEGER - should cause ERROR_BAD_REQUEST
      [{ arg: 2343546576878989879789 }, INVALID_DATE],
      [{ arg: -2343546576878989879789 }, INVALID_DATE],
      // Scientific notation - should cause ERROR_BAD_REQUEST
      [{ arg: 1.234e+30 }, INVALID_DATE],
      [{ arg: -1.234e+30 }, INVALID_DATE],
    ]);
  });
};
