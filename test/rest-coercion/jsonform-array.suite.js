// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var jsonFormContext = require('./_jsonform.context');

var INVALID_DATE = new Date(NaN);

module.exports = function(ctx) {
  ctx = jsonFormContext(ctx);
  var EMPTY_BODY = ctx.EMPTY_BODY;
  var ERROR_BAD_REQUEST = ctx.ERROR_BAD_REQUEST;
  var verifyTestCases = ctx.verifyTestCases;

  describe('json form - array - required', function() {
    // The exact type is not important to test how required array parameters
    // treat missing values, therefore we test a single type (boolean) only.
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({ arg: 'arg', type: ['boolean'], required: true }, [
      // Valid values
      [{ arg: [] }, []], // empty array is a valid value
      [{ arg: [true, false] }, [true, false]],

      // Empty values should trigger ERROR_BAD_REQUEST
      [EMPTY_BODY, []],
      [{ arg: null }, [false]],

      // Invalid values  should trigger ERROR_BAD_REQUEST
      [{ arg: [null] }, [false]],
      [{ arg: false }, [false]],
      [{ arg: true }, [true]],
      [{ arg: 0 }, [false]],
      [{ arg: 1 }, [true]],
      [{ arg: '' }, []],
      [{ arg: 'text' }, [true]],
    ]);
  });

  describe('json form - array of booleans - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({ arg: 'arg', type: ['boolean'] }, [
      // Empty values
      [EMPTY_BODY, []], // should be: undefined
      [{ arg: [] }, []],
      [{ arg: null }, [false]], // should be: null

      // Valid values
      [{ arg: [false] }, [false]],
      [{ arg: [true] }, [true]],
      [{ arg: [true, false] }, [true, false]],

      // Value is not an array - should return ERROR_BAD_REQUEST
      [{ arg: false }, [false]],
      [{ arg: true }, [true]],
      [{ arg: 0 }, [false]],
      [{ arg: 1 }, [true]],
      [{ arg: 2 }, [true]],
      [{ arg: -1 }, [true]],
      [{ arg: 'text' }, [true]],
      [{ arg: {}}, [true]],

      // Array items have wrong type - should return ERROR_BAD_REQUEST
      [{ arg: [null] }, [false]],
      [{ arg: ['true', 'false'] }, [true, false]],
      [{ arg: ['0'] }, [false]],
      [{ arg: ['1'] }, [true]],
      [{ arg: ['2'] }, [true]],
      [{ arg: ['-1'] }, [true]],
      [{ arg: ['text'] }, [true]],
      [{ arg: [{}] }, [true]],
      [{ arg: [[]] }, [true]],
    ]);
  });

  describe('json form - array of numbers - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({ arg: 'arg', type: ['number'] }, [
      // Empty values
      [EMPTY_BODY, []], // should be: undefined
      [{ arg: [] }, []],
      [{ arg: null }, [0]], // should be: null

      // Valid values
      [{ arg: [0] }, [0]],
      [{ arg: [1] }, [1]],
      [{ arg: [-1] }, [-1]],
      [{ arg: [0, 2, -2] }, [0, 2, -2]],
      [{ arg: [1.2, -1.2] }, [1.2, -1.2]],
      // Numbers larger than MAX_SAFE_INTEGER get trimmed
      [{ arg: [2343546576878989879789] }, [2.34354657687899e+21]],
      [{ arg: [-2343546576878989879789] }, [-2.34354657687899e+21]],
      // Scientific notation
      [{ arg: [1.234e+30] }, [1.234e+30]],
      [{ arg: [-1.234e+30] }, [-1.234e+30]],

      // Value is not an array - should return ERROR_BAD_REQUEST
      [{ arg: false }, [0]],
      [{ arg: true }, [1]],
      [{ arg: 0 }, [0]],
      [{ arg: '0' }, [0]],
      [{ arg: 1 }, [1]],
      [{ arg: '1' }, [1]],
      [{ arg: -1 }, [-1]],
      [{ arg: '-1' }, [-1]],
      [{ arg: 1.2 }, [1.2]],
      [{ arg: '1.2' }, [1.2]],
      [{ arg: -1.2 }, [-1.2]],
      [{ arg: '-1.2' }, [-1.2]],
      [{ arg: 'text' }, ERROR_BAD_REQUEST],
      [{ arg: {}}, ERROR_BAD_REQUEST],
      [{ arg: { a: true }}, ERROR_BAD_REQUEST],

      // Array items have wrong type - should return ERROR_BAD_REQUEST
      [{ arg: [null] }, [0]],
      [{ arg: ['0'] }, [0]],
      [{ arg: ['1'] }, [1]],
      [{ arg: ['-1'] }, [-1]],
      [{ arg: ['1.2'] }, [1.2]],
      [{ arg: ['-1.2'] }, [-1.2]],
      [{ arg: ['text'] }, ERROR_BAD_REQUEST],
      [{ arg: [1, 'text'] }, ERROR_BAD_REQUEST],
    ]);
  });

  describe('json form - array of strings - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({ arg: 'arg', type: ['string'] }, [
      // Empty values
      [EMPTY_BODY, []], // should be: undefined
      [{ arg: [] }, []],
      [{ arg: null }, ['null']], // should be: null

      // Valid values
      [{ arg: 'text' }, ['text']],
      [{ arg: ['one', 'two'] }, ['one', 'two']],

      // Value is not an array - should return ERROR_BAD_REQUEST
      [{ arg: false }, ['false']],
      [{ arg: true }, ['true']],
      [{ arg: 0 }, ['0']],
      [{ arg: 1 }, ['1']],
      [{ arg: {}}, ['[object Object]']],

      // Array items have wrong type - should return ERROR_BAD_REQUEST
      [{ arg: [null] }, ['null']],
      [{ arg: [0] }, ['0']],
      [{ arg: [1] }, ['1']],
      [{ arg: [true] }, ['true']],
      [{ arg: [{}] }, ['[object Object]']],
      [{ arg: [[]] }, ['']],
    ]);
  });

  describe('json form - array of dates - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({ arg: 'arg', type: ['date'] }, [
      // Empty values
      [EMPTY_BODY, []], // should be: undefined
      [{ arg: [] }, []],
      [{ arg: null }, [new Date(0)]], // should be: null

      // Valid values - numbers are treated as timestamps
      [{ arg: [0] }, [new Date(0)]],
      [{ arg: [1] }, [new Date(1)]],

      // Valid values - numeric strings are passed to Date.parse
      [{ arg: ['0'] }, [new Date('0')]], // 1999-12-31T23:00:00.000Z in CEST
      [{ arg: ['1'] }, [new Date('1')]], // 2000-12-31T23:00:00.000Z

      // Valid values in ISO format
      [{ arg: ['2016-05-19T13:28:51.299Z'] },
        [new Date('2016-05-19T13:28:51.299Z')]],
      [{ arg: ['2016-05-19T13:28:51.299Z', '2016-05-20T08:27:28.539Z'] }, [
        new Date('2016-05-19T13:28:51.299Z'),
        new Date('2016-05-20T08:27:28.539Z'),
      ]],

      // Value is not an array - should return ERROR_BAD_REQUEST
      [{ arg: false }, [new Date(0)]],
      [{ arg: true }, [new Date(1)]],
      [{ arg: 'text' }, [INVALID_DATE]],
      [{ arg: '2016-05-19T13:28:51.299Z' },
        [new Date('2016-05-19T13:28:51.299Z')]],

      // Array items have wrong type - should return ERROR_BAD_REQUEST
      [{ arg: [null] }, [new Date(0)]],
      [{ arg: ['text'] }, [INVALID_DATE]],
    ]);
  });

  describe('json form - array of any - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({ arg: 'arg', type: ['any'] }, [
      // Empty values
      [EMPTY_BODY, []], // should be: undefined
      [{ arg: [] }, []],
      [{ arg: null }, [null]], // should be: null

      // Valid values - booleans
      [{ arg: [true, false] }, [true, false]],

      // Valid values - numbers
      [{ arg: [0] }, [0]],
      [{ arg: [1] }, [1]],
      [{ arg: [-1] }, [-1]],
      [{ arg: [0, 2, -2] }, [0, 2, -2]],
      [{ arg: [1.2, -1.2] }, [1.2, -1.2]],

      // Valid values - dates - should we coerce?
      [{ arg: ['2016-05-19T13:28:51.299Z'] },
        ['2016-05-19T13:28:51.299Z']],

      // Valid values - strings
      [{ arg: ['text'] }, ['text']],

      // Boolean-like strings should not be coerced
      [{ arg: ['true'] }, ['true']],

      // Number-like strings should not be coerced
      [{ arg: ['0'] }, ['0']],
      [{ arg: ['1'] }, ['1']],
      [{ arg: ['-1'] }, ['-1']],
      [{ arg: ['1.2'] }, ['1.2']],
      [{ arg: ['-1.2'] }, ['-1.2']],

      // Valid values - nulls
      [{ arg: [null] }, [null]],

      // Valid values - objects
      [{ arg: [{}] }, [{}]],
      [{ arg: [{ a: 1 }] }, [{ a: 1 }]],
      [{ arg: [[]] }, [[]]],
      [{ arg: [[1]] }, [[1]]],

      // Valids values - mixed types
      [{ arg: ['text', 10, false] }, ['text', 10, false]],

      // Value is not an array - should return ERROR_BAD_REQUEST
      [{ arg: false }, [false]],
      [{ arg: true }, [true]],
      [{ arg: 0 }, [0]],
      [{ arg: 1 }, [1]],
      [{ arg: -1 }, [-1]],
      [{ arg: 1.2 }, [1.2]],
      [{ arg: -1.2 }, [-1.2]],
      [{ arg: 'text' }, ['text']],
      [{ arg: {}}, [{}]],
    ]);
  });
};
