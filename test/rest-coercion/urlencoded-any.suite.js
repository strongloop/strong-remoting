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

  describe(prefix + ' - any - required', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'arg', type: 'any', required: true}, [
      // Valid values
      ['arg=1234', 1234],
      ['arg=text', 'text'],

      // Empty values should trigger ERROR_BAD_REQUEST
      [EMPTY_QUERY, ERROR_BAD_REQUEST],
      ['arg', ERROR_BAD_REQUEST],
      ['arg=', ERROR_BAD_REQUEST],
      ['arg=null', ERROR_BAD_REQUEST],
    ]);
  });

  describe(prefix + ' - any - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'arg', type: 'any'}, [
      // Empty values
      [EMPTY_QUERY, undefined],
      ['arg', undefined],
      ['arg=', undefined],
      ['arg=null', null], // should be: 'null'

      // Valid values (coerced)
      ['arg=undefined', 'undefined'], // 'undefined' is treated as a string
      ['arg=false', false],
      ['arg=true', true],
      ['arg=0', 0],
      ['arg=1', 1],
      ['arg=-1', -1],
      ['arg=1.2', 1.2],
      ['arg=-1.2', -1.2],
      ['arg=text', 'text'],
      ['arg=[]', []],
      ['arg={}', {}],
      ['arg={"x":1}', {x: 1}],
      ['arg={"x":"1"}', {x: '1'}],
      ['arg={x:1}', '{x:1}'], // invalid JSON - the key is not quoted
      ['arg=[1]', [1]],
      ['arg=["1"]', ['1']],

      // Numbers larger than MAX_SAFE_INTEGER are treated as strings
      ['arg=2343546576878989879789', '2343546576878989879789'],
      ['arg=-2343546576878989879789', '-2343546576878989879789'],
      // Numbers starting with a leading zero are treated as strings
      // See https://github.com/strongloop/strong-remoting/issues/143
      ['arg=0668', '0668'],
      // However, floats are correctly parsed
      ['arg=0.42', 0.42],
      // Scientific notation should be recognized as a number
      ['arg=1.234e%2B30', '1.234e+30'],
      ['arg=-1.234e%2B30', '-1.234e+30'],
      // Should `any` recognize date format?
      ['arg=2016-05-19T13:28:51.299Z', '2016-05-19T13:28:51.299Z'],
      ['arg=2016-05-19', '2016-05-19'],
      ['arg=Thu+May+19+2016+15:28:51+GMT+0200+(CEST)',
        'Thu May 19 2016 15:28:51 GMT 0200 (CEST)'],
    ]);
  });
}
