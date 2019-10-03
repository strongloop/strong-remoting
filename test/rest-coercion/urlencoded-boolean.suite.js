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

  describe(prefix + ' - boolean - required', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'arg', type: 'boolean', required: true}, [
      // Valid values
      ['arg=false', false],
      ['arg=true', true],
      ['arg=0', false],

      // Empty values should trigger ERROR_BAD_REQUEST
      [EMPTY_QUERY, ERROR_BAD_REQUEST],
      ['arg', ERROR_BAD_REQUEST],
      ['arg=', ERROR_BAD_REQUEST],

      // Empty-like values should trigger ERROR_BAD_REQUEST too
      ['arg=undefined', ERROR_BAD_REQUEST],
      ['arg=null', ERROR_BAD_REQUEST],
    ]);
  });

  describe(prefix + ' - boolean - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'arg', type: 'boolean'}, [
      // Empty values
      [EMPTY_QUERY, undefined],
      ['arg', undefined],
      ['arg=', undefined],

      // Valid values
      ['arg=false', false],
      ['arg=true', true],
      ['arg=0', false],
      ['arg=1', true],
      // values are case insensitive
      ['arg=FalsE', false],
      ['arg=TruE', true],
      ['arg=FALSE', false],
      ['arg=TRUE', true],

      // Invalid values should trigger ERROR_BAD_REQUEST
      ['arg=undefined', ERROR_BAD_REQUEST],
      ['arg=null', ERROR_BAD_REQUEST],
      ['arg=2', ERROR_BAD_REQUEST],
      ['arg=text', ERROR_BAD_REQUEST],
      ['arg=[]', ERROR_BAD_REQUEST],
      ['arg=[1,2]', ERROR_BAD_REQUEST],
      ['arg={}', ERROR_BAD_REQUEST],
      ['arg={"a":true}', ERROR_BAD_REQUEST],
    ]);
  });
}
