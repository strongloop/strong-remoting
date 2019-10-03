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

  describe(prefix + ' - array - required', function() {
    // The exact type is not important to test how required array parameters
    // treat missing values, therefore we test a single type (boolean) only.
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'arg', type: ['boolean'], required: true}, [
      // Valid values - JSON encoding
      ['arg=[]', []],
      ['arg=[true,false]', [true, false]],

      // Valid values - nested keys
      ['arg=false', [false]],
      ['arg=true', [true]],
      ['arg=0', [false]],
      ['arg=1', [true]],
      ['arg=true&arg=false', [true, false]],

      // Empty values should trigger ERROR_BAD_REQUEST
      [EMPTY_QUERY, ERROR_BAD_REQUEST],
      ['arg', ERROR_BAD_REQUEST],
      ['arg=', ERROR_BAD_REQUEST],

      // Invalid values - array items have wrong type or value is not an array
      // All test cases should trigger ERROR_BAD_REQUEST
      ['arg=null', ERROR_BAD_REQUEST],
      ['arg=undefined', ERROR_BAD_REQUEST],
      ['arg={}', ERROR_BAD_REQUEST],
      ['arg=["true"]', ERROR_BAD_REQUEST],
      ['arg=[1]', ERROR_BAD_REQUEST],
    ]);
  });

  describe(prefix + ' - array of booleans - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'arg', type: ['boolean']}, [
      // Empty values
      [EMPTY_QUERY, undefined],
      ['arg', undefined],
      ['arg=', undefined],
      ['arg=null', null],

      // Valid values - repeated keys
      ['arg=false', [false]],
      ['arg=true', [true]],
      ['arg=0', [false]],
      ['arg=1', [true]],
      ['arg=true&arg=false', [true, false]],

      // Valid values - JSON encoding
      ['arg=[]', []],
      ['arg=[true,false]', [true, false]],

      // Invalid values should trigger ERROR_BAD_REQUEST
      ['arg=undefined', ERROR_BAD_REQUEST],
      ['arg=true&arg=text', ERROR_BAD_REQUEST],
      ['arg=2', ERROR_BAD_REQUEST],
      ['arg=-1', ERROR_BAD_REQUEST],
      ['arg=text', ERROR_BAD_REQUEST],
      ['arg=[1,2]', ERROR_BAD_REQUEST],
      ['arg=["text"]', ERROR_BAD_REQUEST],
      ['arg=[null]', ERROR_BAD_REQUEST],
      ['arg={}', ERROR_BAD_REQUEST],
      ['arg={"a":true}', ERROR_BAD_REQUEST],

      // Malformed JSON should trigger ERROR_BAD_REQUEST
      ['arg={malformed}', ERROR_BAD_REQUEST],
      ['arg=[malformed]', ERROR_BAD_REQUEST],
    ]);
  });

  describe(prefix + ' - array of numbers - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'arg', type: ['number']}, [
      // Empty values
      [EMPTY_QUERY, undefined],
      ['arg', undefined],
      ['arg=', undefined],
      ['arg=null', null],

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
      ['arg=true', ERROR_BAD_REQUEST],
      ['arg=false', ERROR_BAD_REQUEST],
      ['arg=text', ERROR_BAD_REQUEST],
      ['arg=1&arg=text', ERROR_BAD_REQUEST],
      ['arg=["1"]', ERROR_BAD_REQUEST], // notice the item is a string
      ['arg=[1,"text"]', ERROR_BAD_REQUEST],
      ['arg=[null]', ERROR_BAD_REQUEST],
      ['arg={}', ERROR_BAD_REQUEST],
      ['arg={"a":true}', ERROR_BAD_REQUEST],

      // Numbers starting with a leading zero are parsed,
      // because we know the expected type is a number.
      // See https://github.com/strongloop/strong-remoting/issues/143
      ['arg=0668', [668]],
      ['arg=0.42', [0.42]],

      // Malformed JSON should trigger ERROR_BAD_REQUEST
      ['arg={malformed}', ERROR_BAD_REQUEST],
      ['arg=[malformed]', ERROR_BAD_REQUEST],
    ]);
  });

  describe(prefix + ' - array of strings - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'arg', type: ['string']}, [
      // Empty values
      [EMPTY_QUERY, undefined],
      ['arg', undefined],
      ['arg=', undefined],
      ['arg=null', null],

      // Valid values - repeated keys
      ['arg=undefined', ['undefined']],
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
      ['arg=["1","2"]', ['1', '2']],

      // Valid values - array arguments don't recognize object value
      // and treat them as single-item string
      ['arg={}', ['{}']],
      ['arg={"a":true}', ['{"a":true}']],
      ['arg={malformed}', ['{malformed}']],

      // Numbers starting with a leading zero are treated as strings
      // See https://github.com/strongloop/strong-remoting/issues/143
      ['arg=0668', ['0668']],
      ['arg=0.42', ['0.42']],

      // Invalid values should trigger ERROR_BAD_REQUEST
      ['arg=[1]', ERROR_BAD_REQUEST],
      ['arg=[1,2]', ERROR_BAD_REQUEST],
      ['arg=[true]', ERROR_BAD_REQUEST],
      ['arg=[null]', ERROR_BAD_REQUEST],

      // Malformed JSON should trigger ERROR_BAD_REQUEST
      ['arg=[malformed]', ERROR_BAD_REQUEST],
    ]);
  });

  describe(prefix + ' - array of dates - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'arg', type: ['date']}, [
      // Empty values
      [EMPTY_QUERY, undefined],
      ['arg', undefined],
      ['arg=', undefined],
      ['arg=null', null],

      // Valid values - repeated keys
      ['arg=0', [new Date('1970-01-01T00:00:00.000Z')]],
      ['arg=1', [new Date('1970-01-01T00:00:00.001Z')]],
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
      ['arg=undefined', ERROR_BAD_REQUEST],
      ['arg=false', ERROR_BAD_REQUEST],
      ['arg=true', ERROR_BAD_REQUEST],
      ['arg=text', ERROR_BAD_REQUEST],
      ['arg={}', ERROR_BAD_REQUEST],
      ['arg={"a":true}', ERROR_BAD_REQUEST],
      ['arg=[null]', ERROR_BAD_REQUEST],
      ['arg=[false]', ERROR_BAD_REQUEST],
      ['arg=[true]', ERROR_BAD_REQUEST],
      ['arg=["text"]', ERROR_BAD_REQUEST],

      // Malformed JSON should trigger ERROR_BAD_REQUEST
      ['arg={malformed}', ERROR_BAD_REQUEST],
      ['arg=[malformed]', ERROR_BAD_REQUEST],
    ]);
  });

  describe(prefix + ' - array of any - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'arg', type: ['any']}, [
      // Empty values
      [EMPTY_QUERY, undefined],
      ['arg', undefined],
      ['arg=', undefined],
      ['arg=null', null],

      // Valid values - repeated keys
      ['arg=undefined', ['undefined']],
      ['arg=false', [false]],
      ['arg=true', [true]],
      ['arg=0', [0]],
      ['arg=1', [1]],
      ['arg=-1', [-1]],
      ['arg=1.2', [1.2]],
      ['arg=-1.2', [-1.2]],
      ['arg=text', ['text']],
      ['arg=text&arg=10&arg=false', ['text', 10, false]],
      // Numbers larger than MAX_SAFE_INTEGER
      ['arg=2343546576878989879789', ['2343546576878989879789']],
      ['arg=-2343546576878989879789', ['-2343546576878989879789']],
      // Scientific notation - should it be recognized as a number?
      ['arg=1.234e%2B30&arg=-1.234e%2B30', ['1.234e+30', '-1.234e+30']],

      // Integers starting with a leading zero are treated as strings
      // See https://github.com/strongloop/strong-remoting/issues/143
      ['arg=0668', ['0668']],
      // However, floats are correctly parsed
      ['arg=0.42', [0.42]],

      // Valid values - JSON encoding
      ['arg=[]', []],
      ['arg=["text",10,false]', ['text', 10, false]],

      // Valid values - items are objects
      ['arg={}', [{}]],
      ['arg={"foo":"bar"}', [{'foo': 'bar'}]],
      // Item is not a valid JSON object - it will be treated as a string
      ['arg={malformed}', ['{malformed}']],

      // Malformed JSON should trigger ERROR_BAD_REQUEST
      ['arg=[malformed]', ERROR_BAD_REQUEST],
    ]);
  });
}
