// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var urlEncodedContext = require('./_urlencoded.context');

var INVALID_DATE = new Date(NaN);

module.exports = function(ctx) {
  suite('query string', urlEncodedContext(ctx, 'qs'));
  suite('form data', urlEncodedContext(ctx, 'form'));
};

function suite(prefix, ctx) {
  var EMPTY_QUERY = ctx.EMPTY_QUERY;
  var ERROR_BAD_REQUEST = ctx.ERROR_BAD_REQUEST;
  var verifyTestCases = ctx.verifyTestCases;

  describe(prefix + ' - date - required', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({ arg: 'arg', type: 'date', required: true }, [
      // Valid values
      ['arg=2016-05-19T13:28:51.299Z', new Date('2016-05-19T13:28:51.299Z')],

      // Empty values should trigger ERROR_BAD_REQUEST
      [EMPTY_QUERY, ERROR_BAD_REQUEST],
      ['arg', INVALID_DATE],
      ['arg=', INVALID_DATE],

      // Empty-like values should trigger ERROR_BAD_REQUEST too
      ['arg=undefined', INVALID_DATE],
      ['arg=null', INVALID_DATE],
    ]);
  });

  describe(prefix + ' - date - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({ arg: 'arg', type: 'date' }, [
      // Empty values
      [EMPTY_QUERY, undefined],
      ['arg', INVALID_DATE], // should be: undefined
      ['arg=', INVALID_DATE], // should be: undefined

      // Valid values - ISO format
      ['arg=2016-05-19T13:28:51.299Z', new Date('2016-05-19T13:28:51.299Z')],
      ['arg=2016-05-19', new Date('2016-05-19')],
      ['arg=Thu+May+19+2016+15:28:51+GMT+0200+(CEST)',
        new Date('2016-05-19T15:28:51.000Z')],

      // NOTE(bajtos) should we convert the numeric values into a number
      // before passing it to the Date constructor?
      // That way ?arg=0 would produce '1970-01-01T00:00:00.000Z', which is
      // arguably more expected then some date around 1999/2000/2001
      // Also note that with the current implementation, the parsed
      // value depends on the timezone of the server, therefore
      // we cannot specify exact date values here in the test
      // and have to use the same Date input as in the HTTP request :(
      // See also https://github.com/strongloop/strong-remoting/issues/238
      ['arg=0', new Date('0')], // 1999-12-31T23:00:00.000Z in CEST
      ['arg=1', new Date('1')], // 2000-12-31T23:00:00.000Z
      ['arg=-1', new Date('-1')], // 2000-12-31T23:00:00.000Z
      ['arg=1.2', new Date('1.2')], // 2001-01-01T23:00:00.000Z
      ['arg=-1.2', new Date('-1.2')], // 2001-01-01T23:00:00.000Z

      // Invalid values should trigger ERROR_BAD_REQUEST
      ['arg=undefined', INVALID_DATE],
      ['arg=null', INVALID_DATE],
      ['arg=false', INVALID_DATE],
      ['arg=true', INVALID_DATE],
      ['arg=text', INVALID_DATE],
      ['arg=[]', INVALID_DATE],
      ['arg={}', INVALID_DATE],
      // Numbers larger than MAX_SAFE_INTEGER - should cause ERROR_BAD_REQUEST
      ['arg=2343546576878989879789', INVALID_DATE],
      ['arg=-2343546576878989879789', INVALID_DATE],
      // Scientific notation - should cause ERROR_BAD_REQUEST
      ['arg=1.234e%2B30', INVALID_DATE],
      ['arg=-1.234e%2B30', INVALID_DATE],
    ]);
  });
}
