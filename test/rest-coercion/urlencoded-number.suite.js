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

  describe(prefix + ' - number - required', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'arg', type: 'number', required: true}, [
      // Valid values
      ['arg=0', 0],
      ['arg=1', 1],
      ['arg=-1', -1],

      // Empty values should trigger ERROR_BAD_REQUEST
      [EMPTY_QUERY, ERROR_BAD_REQUEST],
      ['arg', ERROR_BAD_REQUEST],
      ['arg=', ERROR_BAD_REQUEST],

      // Empty-like values should trigger ERROR_BAD_REQUEST too
      ['arg=undefined', ERROR_BAD_REQUEST],
      ['arg=null', ERROR_BAD_REQUEST],
    ]);
  });

  describe(prefix + ' - number - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'arg', type: 'number'}, [
      // Empty values
      [EMPTY_QUERY, undefined],
      ['arg', undefined],
      ['arg=', undefined],

      // Valid values
      ['arg=0', 0],
      ['arg=1', 1],
      ['arg=-1', -1],
      ['arg=1.2', 1.2],
      ['arg=-1.2', -1.2],
      // Numbers larger than MAX_SAFE_INTEGER get trimmed
      ['arg=2343546576878989879789', 2.34354657687899e+21],
      ['arg=-2343546576878989879789', -2.34354657687899e+21],
      // Scientific notation
      ['arg=1.234e%2B30', 1.234e+30],
      ['arg=-1.234e%2B30', -1.234e+30],

      // Invalid values should trigger ERROR_BAD_REQUEST
      ['arg=undefined', ERROR_BAD_REQUEST],
      ['arg=null', ERROR_BAD_REQUEST],
      ['arg=true', ERROR_BAD_REQUEST],
      ['arg=false', ERROR_BAD_REQUEST],
      ['arg=text', ERROR_BAD_REQUEST],
      ['arg=[]', ERROR_BAD_REQUEST],
      ['arg=[1,2]', ERROR_BAD_REQUEST],
      ['arg={}', ERROR_BAD_REQUEST],
      ['arg={"a":true}', ERROR_BAD_REQUEST],

      // Numbers starting with a leading zero are parsed,
      // because we know the expected type is a number.
      // See https://github.com/strongloop/strong-remoting/issues/143
      ['arg=0668', 668],
      ['arg=0.42', 0.42],
    ]);
  });
}
