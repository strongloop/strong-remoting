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

  describe(prefix + ' - array - required', function() {
    // The exact type is not important to test how required array parameters
    // treat missing values, therefore we test a single type (boolean) only.
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({ arg: 'arg', type: ['boolean'], required: true }, [
      // Valid values - JSON encoding
      ['arg=[]', []],
      ['arg=[true,false]', [true, false]],

      // Valid values - nested keys
      ['arg=false', [false]],
      ['arg=true', [true]],
      ['arg=true&arg=false', [true, false]],

      // Empty values should trigger ERROR_BAD_REQUEST
      [EMPTY_QUERY, []], // should be: ERROR_BAD_REQUEST
      ['arg', []], // should be: ERROR_BAD_REQUEST
      ['arg=', []], // should be: ERROR_BAD_REQUEST

      // Invalid values - array items have wrong type or value is not an array
      // All test cases should trigger ERROR_BAD_REQUEST
      ['arg=null', [false]],
      ['arg=undefined', [false]],
      ['arg=0', [false]],
      ['arg=1', [true]],
      ['arg={}', [true]],
      ['arg=["true"]', [true]],
      ['arg=[1]', [true]],
    ]);
  });

  describe(prefix + ' - array of booleans - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({ arg: 'arg', type: ['boolean'] }, [
      // Empty values
      [EMPTY_QUERY, []], // should be: undefined
      ['arg', []], // should be: undefined
      ['arg=', []], // should be: undefined
      ['arg=null', [false]], // should be: null

      // Valid values - repeated keys
      ['arg=false', [false]],
      ['arg=true', [true]],
      ['arg=true&arg=false', [true, false]],

      // Valid values - JSON encoding
      ['arg=[]', []],
      ['arg=[true,false]', [true, false]],

      // Invalid values should trigger ERROR_BAD_REQUEST
      ['arg=undefined', [false]],
      ['arg=true&arg=text', [true, true]],
      ['arg=0', [false]],
      ['arg=1', [true]],
      ['arg=2', [true]],
      ['arg=-1', [true]],
      ['arg=text', [true]],
      ['arg=[1,2]', [true, true]],
      ['arg=["text"]', [true]],
      ['arg=[null]', [false]],
      ['arg={}', [true]],
      ['arg={"a":true}', [true]],

      // Malformed JSON should trigger ERROR_BAD_REQUEST
      ['arg={malformed}', [true]],
      ['arg=[malformed]', [true]],
    ]);
  });

  describe(prefix + ' - array of numbers - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({ arg: 'arg', type: ['number'] }, [
      // Empty values
      [EMPTY_QUERY, []], // should be: undefined
      ['arg', []], // should be: undefined
      ['arg=', []], // should be: undefined

      // Valid values - repeated keys
      ['arg=0', [0]],
      ['arg=1', [1]],
      ['arg=-1', [-1]],
      ['arg=1.2', [1.2]],
      ['arg=-1.2', [-1.2]],
      ['arg=1&arg=2', [1, 2]],
      // Numbers larger than MAX_SAFE_INTEGER get trimmed
      ['arg=2343546576878989879789', [2.34354657687899e+21]],
      ['arg=-2343546576878989879789', [-2.34354657687899e+21]],
      // Scientific notation
      ['arg=1.234e%2B30', [1.234e+30]],
      ['arg=-1.234e%2B30', [-1.234e+30]],

      // Valid values - JSON encoding
      ['arg=[]', []],
      ['arg=[1,2]', [1, 2]],

      // Invalid values should trigger ERROR_BAD_REQUEST
      ['arg=undefined', ERROR_BAD_REQUEST],
      ['arg=null', ERROR_BAD_REQUEST],
      ['arg=true', ERROR_BAD_REQUEST],
      ['arg=false', ERROR_BAD_REQUEST],
      ['arg=text', ERROR_BAD_REQUEST],
      ['arg=1&arg=text', ERROR_BAD_REQUEST],
      ['arg=["1"]', [1]], // notice the item is a string, we should not coerce
      ['arg=[1,"text"]', ERROR_BAD_REQUEST],
      ['arg=[null]', [0]],
      ['arg={}', ERROR_BAD_REQUEST],
      ['arg={"a":true}', ERROR_BAD_REQUEST],

      // Malformed JSON should trigger ERROR_BAD_REQUEST
      ['arg={malformed}', ERROR_BAD_REQUEST],
      ['arg=[malformed]', ERROR_BAD_REQUEST],
    ]);
  });

  describe(prefix + ' - array of strings - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({ arg: 'arg', type: ['string'] }, [
      // Empty values
      [EMPTY_QUERY, []], // should be: undefined
      ['arg', []], // should be: undefined
      ['arg=', []], // should be: undefined

      // Valid values - repeated keys
      ['arg=undefined', ['undefined']],
      ['arg=null', ['null']],
      ['arg=0', ['0']],
      ['arg=1', ['1']],
      ['arg=false', ['false']],
      ['arg=true', ['true']],
      ['arg=-1', ['-1']],
      ['arg=1.2', ['1.2']],
      ['arg=-1.2', ['-1.2']],
      ['arg=text', ['text']],
      ['arg=one&arg=two', ['one', 'two']],

      // Valid values - JSON encoding
      ['arg=[]', []],
      ['arg=[1,2]', ['1', '2']],

      // Invalid values should trigger ERROR_BAD_REQUEST
      ['arg={}', ['{}']],
      ['arg={"a":true}', ['{"a":true}']],
      ['arg=[1]', ['1']],
      ['arg=[true]', ['true']],
      ['arg=[null]', ['null']],

      // Malformed JSON should trigger ERROR_BAD_REQUEST
      ['arg={malformed}', ['{malformed}']],
      ['arg=[malformed]', ['[malformed]']],
    ]);
  });

  describe(prefix + ' - array of dates - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({ arg: 'arg', type: ['date'] }, [
      // Empty values
      [EMPTY_QUERY, []], // should be: undefined
      ['arg', []], // should be: undefined
      ['arg=', []], // should be: undefined

      // Valid values - repeated keys
      ['arg=0', [new Date('0')]], // 1999-12-31T23:00:00.000Z in CEST
      ['arg=1', [new Date('1')]], // 2000-12-31T23:00:00.000Z
      ['arg=text', [INVALID_DATE]], // should be: ERROR_BAD_REQUEST
      ['arg=2016-05-19T13:28:51.299Z',
        [new Date('2016-05-19T13:28:51.299Z')]],
      ['arg=2016-05-19T13:28:51.299Z&arg=2016-05-20T08:27:28.539Z', [
        new Date('2016-05-19T13:28:51.299Z'),
        new Date('2016-05-20T08:27:28.539Z'),
      ]],

      // Valid values - JSON encoding
      ['arg=[]', []],
      ['arg=[0]', [new Date(0)]],
      ['arg=[1]', [new Date(1)]],
      ['arg=[-1]', [new Date(-1)]],
      ['arg=["2016-05-19T13:28:51.299Z"]',
        [new Date('2016-05-19T13:28:51.299Z')]],
      ['arg=["2016-05-19T13:28:51.299Z", "2016-05-20T08:27:28.539Z"]', [
        new Date('2016-05-19T13:28:51.299Z'),
        new Date('2016-05-20T08:27:28.539Z'),
      ]],

      // Invalid values should trigger ERROR_BAD_REQUEST
      ['arg=undefined', [INVALID_DATE]], // should be: ERROR_BAD_REQUEST
      ['arg=null', [INVALID_DATE]], // should be: ERROR_BAD_REQUEST
      ['arg=false', [INVALID_DATE]], // should be: ERROR_BAD_REQUEST
      ['arg=true', [INVALID_DATE]], // should be: ERROR_BAD_REQUEST
      ['arg={}', [INVALID_DATE]], // should be: ERROR_BAD_REQUEST
      ['arg={"a":true}', [INVALID_DATE]],
      ['arg=[null]', [new Date(0)]],
      ['arg=[false]', [new Date(0)]],
      ['arg=[true]', [new Date(1)]],
      ['arg=["text"]', [INVALID_DATE]],

      // Malformed JSON should trigger ERROR_BAD_REQUEST
      ['arg={malformed}', [INVALID_DATE]], // should be: ERROR_BAD_REQUEST
      ['arg=[malformed]', [INVALID_DATE]], // should be: ERROR_BAD_REQUEST
    ]);
  });

  describe(prefix + ' - array of any - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({ arg: 'arg', type: ['any'] }, [
      // Empty values
      [EMPTY_QUERY, []], // should be: undefined
      ['arg', []], // should be: undefined
      ['arg=', []], // should be: undefined
      ['arg=null', [null]], // should be: null (?)

      // Valid values - repeated keys
      ['arg=undefined', ['undefined']],
      ['arg=false', [false]],
      ['arg=true', [true]],
      ['arg=0', ['0']], // should be 0 (number)
      ['arg=1', [1]],
      ['arg=-1', ['-1']], // should be -1 (number)
      ['arg=1.2', [1.2]],
      ['arg=-1.2', ['-1.2']], // should be -1.2 (number)
      ['arg=text', ['text']],
      ['arg=text&arg=10&arg=false', ['text', '10', 'false']], // should be coerced
      // Numbers larger than MAX_SAFE_INTEGER
      ['arg=2343546576878989879789', [2.34354657687899e+21]],
      // this should have been recognized as number
      ['arg=-2343546576878989879789', ['-2343546576878989879789']],
      // Scientific notation - should it be recognized as a number?
      ['arg=1.234e%2B30&arg=-1.234e%2B30', ['1.234e+30', '-1.234e+30']],

      // Valid values - JSON encoding
      ['arg=[]', []],
      ['arg=["text",10,false]', ['text', 10, false]],

      // Invalid values should trigger ERROR_BAD_REQUEST
      ['arg={}', ['{}']],
      ['arg={"foo":"bar"}', ['{"foo":"bar"}']],

      // Malformed JSON should trigger ERROR_BAD_REQUEST
      ['arg={malformed}', ['{malformed}']],
      ['arg=[malformed]', ['[malformed]']],
    ]);
  });
}
