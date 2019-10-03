// Copyright IBM Corp. 2016,2017. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

const urlEncodedContext = require('./_urlencoded.context');

const INVALID_DATE = new Date(NaN);

module.exports = function(ctx) {
  suite('query string', urlEncodedContext(ctx, 'qs'));
  suite('form data', urlEncodedContext(ctx, 'form'));
};

function suite(prefix, ctx) {
  const EMPTY_QUERY = ctx.EMPTY_QUERY;
  const ERROR_BAD_REQUEST = ctx.ERROR_BAD_REQUEST;
  const verifyTestCases = ctx.verifyTestCases;

  describe(prefix + ' - date - required', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'arg', type: 'date', required: true}, [
      // Valid values
      ['arg=2016-05-19T13:28:51.299Z', new Date('2016-05-19T13:28:51.299Z')],

      // Empty values should trigger ERROR_BAD_REQUEST
      [EMPTY_QUERY, ERROR_BAD_REQUEST],
      ['arg', ERROR_BAD_REQUEST],
      ['arg=', ERROR_BAD_REQUEST],

      // Empty-like values should trigger ERROR_BAD_REQUEST too
      ['arg=undefined', ERROR_BAD_REQUEST],
      ['arg=null', ERROR_BAD_REQUEST],
    ]);
  });

  describe(prefix + ' - date - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'arg', type: 'date'}, [
      // Empty values
      [EMPTY_QUERY, undefined],
      ['arg', undefined],
      ['arg=', undefined],

      // Valid values - ISO format
      ['arg=2016-05-19T13:28:51.299Z', new Date('2016-05-19T13:28:51.299Z')],
      ['arg=2016-05-19', new Date('2016-05-19')],
      ['arg=Thu+May+19+2016+15:28:51+GMT+0200+(CEST)',
        new Date('2016-05-19T15:28:51.000Z')],

      // Integer values are converted to a number before passing it to
      // the Date constructor
      // That way ?arg=0 produces '1970-01-01T00:00:00.000Z', which is
      // arguably more expected then some date around 1999/2000/2001
      ['arg=0', new Date('1970-01-01T00:00:00.000Z')],
      ['arg=1', new Date('1970-01-01T00:00:00.001Z')],
      ['arg=-1', new Date('1969-12-31T23:59:59.999Z')],

      // Non-integer numbers are treated as strings.
      ['arg=1.2', new Date('1.2')], // 2001-01-01T23:00:00.000Z
      ['arg=-1.2', new Date('-1.2')], // 2001-01-01T23:00:00.000Z

      // Invalid values should trigger ERROR_BAD_REQUEST
      ['arg=null', ERROR_BAD_REQUEST],
      ['arg=undefined', ERROR_BAD_REQUEST],
      ['arg=false', ERROR_BAD_REQUEST],
      ['arg=true', ERROR_BAD_REQUEST],
      ['arg=text', ERROR_BAD_REQUEST],
      ['arg=[]', ERROR_BAD_REQUEST],
      ['arg={}', ERROR_BAD_REQUEST],
      // Numbers larger than MAX_SAFE_INTEGER - should cause ERROR_BAD_REQUEST
      ['arg=2343546576878989879789', ERROR_BAD_REQUEST],
      ['arg=-2343546576878989879789', ERROR_BAD_REQUEST],
      // Scientific notation - should cause ERROR_BAD_REQUEST
      ['arg=1.234e%2B30', ERROR_BAD_REQUEST],
      ['arg=-1.234e%2B30', ERROR_BAD_REQUEST],
    ]);
  });
}
