// Copyright IBM Corp. 2016,2017. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

const GeoPoint = require('loopback-datatype-geopoint');
const jsonBodyContext = require('./_jsonbody.context');

const INVALID_DATE = new Date(NaN);

module.exports = function(ctx) {
  ctx = jsonBodyContext(ctx);
  const ERROR_BAD_REQUEST = ctx.ERROR_BAD_REQUEST;
  const verifyTestCases = ctx.verifyTestCases;

  describe('json body - array - required', function() {
    // The exact type is not important to test how required array parameters
    // treat missing values, therefore we test a single type (boolean) only.
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'anyname', type: ['boolean'], required: true}, [
      // valid values
      [[]], // an empty array is a valid value for required array
      [[true, false]],
      // invalid values - should trigger ERROR_BAD_REQUEST
      [null, ERROR_BAD_REQUEST],
    ]);
  });

  describe('json body - array of booleans - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'anyname', type: ['boolean']}, [
      // no value is provided
      [null],
      // empty array
      [[]],

      // valid values
      [[false], [false]],
      [[true], [true]],
      [[true, false], [true, false]],

      // Value is not an array - should return ERROR_BAD_REQUEST
      [false, ERROR_BAD_REQUEST],
      [true, ERROR_BAD_REQUEST],
      [0, ERROR_BAD_REQUEST],
      [1, ERROR_BAD_REQUEST],
      [2, ERROR_BAD_REQUEST],
      [-1, ERROR_BAD_REQUEST],
      ['"text"', ERROR_BAD_REQUEST],
      [{}, ERROR_BAD_REQUEST],

      // Array items have wrong type - should return ERROR_BAD_REQUEST
      [[null], ERROR_BAD_REQUEST],
      [['true', 'false'], ERROR_BAD_REQUEST],
      [['0'], ERROR_BAD_REQUEST],
      [['1'], ERROR_BAD_REQUEST],
      [['2'], ERROR_BAD_REQUEST],
      [['-1'], ERROR_BAD_REQUEST],
      [['text'], ERROR_BAD_REQUEST],
      [[{}], ERROR_BAD_REQUEST],
      [[[]], ERROR_BAD_REQUEST],
    ]);
  });

  describe('json body - array of numbers - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'anyname', type: ['number']}, [
      // no value is provided
      [null],
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
      [false, ERROR_BAD_REQUEST],
      [true, ERROR_BAD_REQUEST],
      [0, ERROR_BAD_REQUEST],
      ['"0"', ERROR_BAD_REQUEST],
      [1, ERROR_BAD_REQUEST],
      ['"1"', ERROR_BAD_REQUEST],
      [-1, ERROR_BAD_REQUEST],
      ['"-1"', ERROR_BAD_REQUEST],
      [1.2, ERROR_BAD_REQUEST],
      ['"1.2"', ERROR_BAD_REQUEST],
      [-1.2, ERROR_BAD_REQUEST],
      ['"-1.2"', ERROR_BAD_REQUEST],
      ['"text"', ERROR_BAD_REQUEST],
      [{}, ERROR_BAD_REQUEST],
      [{x: true}, ERROR_BAD_REQUEST],

      // Array items have wrong type - should return ERROR_BAD_REQUEST
      [[null], ERROR_BAD_REQUEST],
      [[true], ERROR_BAD_REQUEST],
      [['0'], ERROR_BAD_REQUEST],
      [['1'], ERROR_BAD_REQUEST],
      [['-1'], ERROR_BAD_REQUEST],
      [['1.2'], ERROR_BAD_REQUEST],
      [['-1.2'], ERROR_BAD_REQUEST],
      [['text'], ERROR_BAD_REQUEST],
      [[1, 'text'], ERROR_BAD_REQUEST],
    ]);
  });

  describe('json body - array of strings - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'anyname', type: ['string']}, [
      // no value is provided
      [null],
      // Empty array
      [[]],

      // Valid values
      [['']],
      [['text']],
      [['one', 'two']],

      // Value is not an array - should return ERROR_BAD_REQUEST
      [false, ERROR_BAD_REQUEST],
      [true, ERROR_BAD_REQUEST],
      [0, ERROR_BAD_REQUEST],
      [1, ERROR_BAD_REQUEST],
      ['"text"', ERROR_BAD_REQUEST],
      [{}, ERROR_BAD_REQUEST],

      // Array items have wrong type - should return ERROR_BAD_REQUEST
      [[null], ERROR_BAD_REQUEST],
      [[1], ERROR_BAD_REQUEST],
      [[true], ERROR_BAD_REQUEST],
      [[{}], ERROR_BAD_REQUEST],
      [[[]], ERROR_BAD_REQUEST],
    ]);
  });

  describe('json body - array of dates - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'anyname', type: ['date']}, [
      // no value is provided
      [null],
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
      [false, ERROR_BAD_REQUEST],
      [true, ERROR_BAD_REQUEST],
      ['text', ERROR_BAD_REQUEST],
      ['2016-05-19T13:28:51.299Z', ERROR_BAD_REQUEST],

      // Array items have wrong type - should return ERROR_BAD_REQUEST
      [[null], ERROR_BAD_REQUEST],
      [[false], ERROR_BAD_REQUEST],
      [[true], ERROR_BAD_REQUEST],
      [['text'], ERROR_BAD_REQUEST],
    ]);
  });

  describe('json body - array of geopoints - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'anyname', type: ['geopoint']}, [
      // no value is provided
      [null],
      // Empty array
      [[]],

      // Valid values - {lat, lng} objects
      [[{lat: 2.3, lng: 3.2}], [new GeoPoint(2.3, 3.2)]],
      [[{lat: 2.3, lng: 3.2}, {lat: 3.3, lng: 3.5}], [
        new GeoPoint(2.3, 3.2),
        new GeoPoint(3.3, 3.5),
      ]],
      // Valid values - [lat,lng] array
      [[[2.3, 3.2]], [new GeoPoint(2.3, 3.2)]],
      [[[2.3, 3.2], [3.3, 2.2]], [
        new GeoPoint(2.3, 3.2),
        new GeoPoint(3.3, 2.2),
      ]],

      // Value is not an array - should return ERROR_BAD_REQUEST
      [false, ERROR_BAD_REQUEST],
      [true, ERROR_BAD_REQUEST],
      [0, ERROR_BAD_REQUEST],
      ['"0"', ERROR_BAD_REQUEST],
      ['"text"', ERROR_BAD_REQUEST],
      [{}, ERROR_BAD_REQUEST],
      [{x: true}, ERROR_BAD_REQUEST],

      // Array items have wrong type - should return ERROR_BAD_REQUEST
      [[null], ERROR_BAD_REQUEST],
      [[true], ERROR_BAD_REQUEST],
      [['0'], ERROR_BAD_REQUEST],
      [['1'], ERROR_BAD_REQUEST],
      [['text'], ERROR_BAD_REQUEST],
      [[1, 'text'], ERROR_BAD_REQUEST],
    ]);
  });

  describe('json body - array of any - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'anyname', type: ['any']}, [
      // no value is provided
      [null],
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
      [[{a: 1}]],
      [[[]]],
      [[[1]]],

      // Valids values - mixed types
      [['text', 10, false]],

      // Value is not an array - should return ERROR_BAD_REQUEST
      [false, ERROR_BAD_REQUEST],
      [true, ERROR_BAD_REQUEST],
      [0, ERROR_BAD_REQUEST],
      [1, ERROR_BAD_REQUEST],
      [-1, ERROR_BAD_REQUEST],
      [1.2, ERROR_BAD_REQUEST],
      [-1.2, ERROR_BAD_REQUEST],
      ['"text"', ERROR_BAD_REQUEST],
      [{}, ERROR_BAD_REQUEST],
    ]);
  });
};
