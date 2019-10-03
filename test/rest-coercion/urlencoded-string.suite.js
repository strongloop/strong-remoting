// Copyright IBM Corp. 2016,2017. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

const urlEncodedContext = require('./_urlencoded.context');

module.exports = function(ctx) {
  suite('query string', urlEncodedContext(ctx, 'qs'));
  suite('form data', urlEncodedContext(ctx, 'form'));
};

function suite(prefix, ctx) {
  const EMPTY_QUERY = ctx.EMPTY_QUERY;
  const ERROR_BAD_REQUEST = ctx.ERROR_BAD_REQUEST;
  const verifyTestCases = ctx.verifyTestCases;

  describe(prefix + ' - string - required', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'arg', type: 'string', required: true}, [
      // Valid values
      ['arg=text', 'text'],
      // Empty-like values are treated as strings
      ['arg=undefined', 'undefined'],
      ['arg=null', 'null'],

      // Empty values should trigger ERROR_BAD_REQUEST
      [EMPTY_QUERY, ERROR_BAD_REQUEST],
      ['arg', ERROR_BAD_REQUEST],
      ['arg=', ERROR_BAD_REQUEST],
    ]);
  });

  describe(prefix + ' - string - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'arg', type: 'string'}, [
      // Empty values
      [EMPTY_QUERY, undefined],
      ['arg', undefined],
      ['arg=', undefined],

      // Valid values - all non-empty value are valid strings
      ['arg=undefined', 'undefined'],
      ['arg=null', 'null'],
      ['arg=0', '0'],
      ['arg=1', '1'],
      ['arg=false', 'false'],
      ['arg=true', 'true'],
      ['arg=-1', '-1'],
      ['arg=1.2', '1.2'],
      ['arg=-1.2', '-1.2'],
      ['arg=text', 'text'],
      ['arg=[]', '[]'],
      ['arg=[1,2]', '[1,2]'],
      ['arg={}', '{}'],
      ['arg={"a":true}', '{"a":true}'],
      // Numbers larger than MAX_SAFE_INTEGER are preserved in string
      ['arg=2343546576878989879789', '2343546576878989879789'],
      ['arg=-2343546576878989879789', '-2343546576878989879789'],
      // Scientific notation
      ['arg=1.234e%2B30', '1.234e+30'],
      ['arg=-1.234e%2B30', '-1.234e+30'],

      // Numbers starting with a leading zero are treated as strings
      // See https://github.com/strongloop/strong-remoting/issues/143
      ['arg=0668', '0668'],
      ['arg=0.42', '0.42'],
    ]);
  });
}
