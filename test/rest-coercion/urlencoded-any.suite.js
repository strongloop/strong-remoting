// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var urlEncodedContext = require('./_urlencoded.context');

module.exports = function(ctx) {
  suite('query string', urlEncodedContext(ctx, 'qs'));
  suite('form data', urlEncodedContext(ctx, 'form'));
};

function suite(prefix, ctx) {
  var EMPTY_QUERY = ctx.EMPTY_QUERY;
  var ERROR_BAD_REQUEST = ctx.ERROR_BAD_REQUEST;
  var verifyTestCases = ctx.verifyTestCases;

  describe(prefix + ' - any - required', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({ arg: 'arg', type: 'any', required: true }, [
      // Valid values
      ['arg=1234', 1234],
      ['arg=text', 'text'],

      // Empty values should trigger ERROR_BAD_REQUEST
      [EMPTY_QUERY, ERROR_BAD_REQUEST],
      ['arg', ''], // should be: ERROR_BAD_REQUEST
      ['arg=', ''], // should be: ERROR_BAD_REQUEST
      ['arg=null', null], // should be: ERROR_BAD_REQUEST
    ]);
  });

  describe(prefix + ' - any - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({ arg: 'arg', type: 'any' }, [
      // Empty values
      [EMPTY_QUERY, undefined],
      ['arg', ''], // should be: undefined
      ['arg=', ''], // should be: undefined
      ['arg=null', null], // should be: 'null'

      // Valid values (coerced)
      ['arg=undefined', 'undefined'], // 'undefined' is treated as a string
      ['arg=false', false],
      ['arg=true', true],
      ['arg=0', '0'], // should be 0 (number)
      ['arg=1', 1],
      ['arg=-1', '-1'], // should be -1 (number)
      ['arg=1.2', 1.2],
      ['arg=-1.2', '-1.2'], // should be -1.2 (number)
      ['arg=text', 'text'],
      ['arg=[]', '[]'], // should be an empty array
      ['arg={}', '{}'], // should be an empty object
      ['arg={x:1}', '{x:1}'], // should be parsed as an object {x:1}
      ['arg={x:"1"}', '{x:"1"}'], // should be parsed as an object {x:'1'}
      ['arg=[1]', '[1]'], // should be parsed as an array [1]
      ['arg=["1"]', '["1"]'], // should be parsed as an array ['1']

      // Numbers larger than MAX_SAFE_INTEGER
      ['arg=2343546576878989879789', 2.34354657687899e+21],
      // This should have been recognized as number
      ['arg=-2343546576878989879789', '-2343546576878989879789'],
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
