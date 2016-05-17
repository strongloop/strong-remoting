// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var jsonBodyContext = require('./_jsonbody.context');

var INVALID_DATE = new Date(NaN);

module.exports = function(ctx) {
  ctx = jsonBodyContext(ctx);
  var ERROR_BAD_REQUEST = ctx.ERROR_BAD_REQUEST;
  var verifyTestCases = ctx.verifyTestCases;

  describe('json body - array - required', function() {
    // The exact type is not important to test how required array parameters
    // treat missing values, therefore we test a single type (boolean) only.
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({ arg: 'anyname', type: ['boolean'], required: true }, [
      // valid values
      [[]], // an empty array is a valid value for required array
      [[true, false]],
      // invalid values - should trigger ERROR_BAD_REQUEST
      [null, [false]], // should be: ERROR_BAD_REQUEST
    ]);
  });

  describe('json body - array of booleans - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({ arg: 'anyname', type: ['boolean'] }, [
      // empty array
      [[]],

      // valid values
      [[false], [false]],
      [[true], [true]],
      [[true, false], [true, false]],

      // Value is not an array - should return ERROR_BAD_REQUEST
      [null, [false]],
      [false, [false]],
      [true, [true]],
      [0, [false]],
      [1, [true]],
      [2, [true]],
      [-1, [true]],
      ['"text"', [true]],
      [{}, [true]],

      // Array items have wrong type - should return ERROR_BAD_REQUEST
      [[null], [false]],
      [['true', 'false'], [true, false]],
      [['0'], [false]],
      [['1'], [true]],
      [['2'], [true]],
      [['-1'], [true]],
      [['text'], [true]],
      [[{}], [true]],
      [[[]], [true]],
    ]);
  });

  describe('json body - array of numbers - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({ arg: 'anyname', type: ['number'] }, [
      // empty array
      [[]],

      // Valid values
      [[0]],
      [[1]],
      [[-1]],
      [[0, 2, -2]],
      [[1.2, -1.2]],
      // Numbers larger than MAX_SAFE_INTEGER get trimmed
      [[2343546576878989879789], [2.34354657687899e+21]],
      [[-2343546576878989879789], [-2.34354657687899e+21]],
      // Scientific notation
      [[1.234e+30], [1.234e+30]],
      [[-1.234e+30], [-1.234e+30]],

      // Value is not an array - should return ERROR_BAD_REQUEST
      [null, [0]],
      [false, [0]],
      [true, [1]],
      [0, [0]],
      ['"0"', [0]],
      [1, [1]],
      ['"1"', [1]],
      [-1, [-1]],
      ['"-1"', [-1]],
      [1.2, [1.2]],
      ['"1.2"', [1.2]],
      [-1.2, [-1.2]],
      ['"-1.2"', [-1.2]],
      ['"text"', ERROR_BAD_REQUEST],
      [{}, ERROR_BAD_REQUEST],
      [{ x: true }, ERROR_BAD_REQUEST],

      // Array items have wrong type - should return ERROR_BAD_REQUEST
      [[null], [0]],
      [[true], [1]],
      [['0'], [0]],
      [['1'], [1]],
      [['-1'], [-1]],
      [['1.2'], [1.2]],
      [['-1.2'], [-1.2]],
      [['text'], ERROR_BAD_REQUEST],
      [[1, 'text'], ERROR_BAD_REQUEST],
    ]);
  });

  describe('json body - array of strings - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({ arg: 'anyname', type: ['string'] }, [
      // Empty array
      [[]],

      // Valid values
      [['']],
      [['text']],
      [['one', 'two']],

      // Value is not an array - should return ERROR_BAD_REQUEST
      [null, ['null']],
      [false, ['false']],
      [true, ['true']],
      [0, ['0']],
      [1, ['1']],
      ['"text"', ['text']],
      [{}, ['[object Object]']],

      // Array items have wrong type - should return ERROR_BAD_REQUEST
      [[null], ['null']],
      [[1], ['1']],
      [[true], ['true']],
      [[{}], ['[object Object]']],
      [[[]], ['']],
    ]);
  });

  describe('json body - array of dates - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({ arg: 'anyname', type: ['date'] }, [
      // Empty array
      [[]],

      // Valid values
      [[0], [new Date(0)]],
      [['0'], [new Date('0')]], // 1999-12-31T23:00:00.000Z in CEST
      [[1], [new Date(1)]],
      [['1'], [new Date('1')]], // 2000-12-31T23:00:00.000Z
      [['2016-05-19T13:28:51.299Z'],
        [new Date('2016-05-19T13:28:51.299Z')]],
      [['2016-05-19T13:28:51.299Z', '2016-05-20T08:27:28.539Z'], [
        new Date('2016-05-19T13:28:51.299Z'),
        new Date('2016-05-20T08:27:28.539Z'),
      ]],

      // Value is not an array - should return ERROR_BAD_REQUEST
      [null, [new Date(0)]],
      [false, [new Date(0)]],
      [true, [new Date(1)]],
      ['text', ERROR_BAD_REQUEST],
      ['2016-05-19T13:28:51.299Z', ERROR_BAD_REQUEST],

      // Array items have wrong type - should return ERROR_BAD_REQUEST
      [[null], [new Date(0)]],
      [[false], [new Date(0)]],
      [[true], [new Date(1)]],
      [['text'], [INVALID_DATE]],
    ]);
  });

  describe('json body - array of any - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({ arg: 'anyname', type: ['any'] }, [
      // Empty array
      [[]],

      // Valid values - booleans
      [[true, false]],

      // Valid values - numbers
      [[0]],
      [[1]],
      [[-1]],
      [[0, 2, -2]],
      [[1.2, -1.2]],

      // Valid values - dates - should we coerce?
      [['2016-05-19T13:28:51.299Z'],
        ['2016-05-19T13:28:51.299Z']],

      // Valid values - strings
      [['text']],

      // Boolean-line strings should not be coerced
      [['true']],

      // Number-like strings should not be coerced
      [['0']],
      [['1']],
      [['-1']],
      [['1.2']],
      [['-1.2']],

      // Valid values - nulls
      [[null]],

      // Valid values - objects
      [[{}]],
      [[{ a: 1 }]],
      [[[]]],
      [[[1]]],

      // Valids values - mixed types
      [['text', 10, false]],

      // Value is not an array - should return ERROR_BAD_REQUEST
      [null, [null]],
      [false, [false]],
      [true, [true]],
      [0, [0]],
      [1, [1]],
      [-1, [-1]],
      [1.2, [1.2]],
      [-1.2, [-1.2]],
      ['"text"', ['text']],
      [{}, [{}]],
    ]);
  });
};
