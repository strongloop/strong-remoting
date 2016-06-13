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

  describe(prefix + ' - boolean - required', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({ arg: 'arg', type: 'boolean', required: true }, [
      // Valid values
      ['arg=false', false],
      ['arg=true', true],

      // Empty values should trigger ERROR_BAD_REQUEST
      [EMPTY_QUERY, false],
      ['arg', false],
      ['arg=', false],

      // Empty-like values should trigger ERROR_BAD_REQUEST too
      ['arg=undefined', false],
      ['arg=null', false],
      ['arg=0', false],
    ]);
  });

  describe(prefix + ' - boolean - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({ arg: 'arg', type: 'boolean' }, [
      // Empty values
      [EMPTY_QUERY, false], // should be: undefined
      ['arg', false], // should be: undefined
      ['arg=', false], // should be: undefined

      // Valid values
      ['arg=false', false],
      ['arg=true', true],
      // values are case insensitive
      ['arg=FalsE', true], // should be false
      ['arg=TruE', true],
      ['arg=FALSE', true], // should be false
      ['arg=TRUE', true],

      // Invalid values should trigger ERROR_BAD_REQUEST
      ['arg=undefined', false],
      ['arg=null', false],
      ['arg=0', false],
      ['arg=1', true],
      ['arg=text', true],
      ['arg=[]', true],
      ['arg=[1,2]', true],
      ['arg={}', true],
      ['arg={"a":true}', true],
    ]);
  });
}
