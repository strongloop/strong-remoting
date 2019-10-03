// Copyright IBM Corp. 2016,2017. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

const jsonBodyContext = require('./_jsonbody.context');
const customClassContext = require('./_custom-class.context.js');

module.exports = function(ctx) {
  ctx = customClassContext(jsonBodyContext(ctx));
  const ERROR_BAD_REQUEST = ctx.ERROR_BAD_REQUEST;
  const CustomClass = ctx.CustomClass;
  const verifyTestCases = ctx.verifyTestCases;

  describe('json body - CustomClass - required', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'anyname', type: 'CustomClass', required: true}, [
      // An empty object is a valid value
      [{}],

      [{name: ''}],
      [{name: 'a-test-name'}],

      // Invalid values trigger ERROR_BAD_REQUEST
      [null, ERROR_BAD_REQUEST],
      [{invalid: true}, ERROR_BAD_REQUEST],

      // Array values are not allowed
      [[], ERROR_BAD_REQUEST],
      [[1, 2], ERROR_BAD_REQUEST],
    ]);
  });

  describe('json body - CustomClass - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'anyname', type: 'CustomClass'}, [
      // Empty values
      [null, null],

      // Valid values
      [{}],
      [{name: 'a-test-name'}],

      // Verify that deep coercion is not triggered
      // and types specified in JSON are preserved

      [{name: ''}],
      [{name: null}],
      [{name: {}}],
      [{name: {key: null}}],
      [{name: 1}],
      [{name: '1'}],
      [{name: -1}],
      [{name: '-1'}],
      [{name: 1.2}],
      [{name: '1.2'}],
      [{name: -1.2}],
      [{name: '-1.2'}],
      [{name: ['tenamet']}],
      [{name: [1, 2]}],

      // Invalid values - arrays are rejected
      [[], ERROR_BAD_REQUEST],
      [[1, 2], ERROR_BAD_REQUEST],

      // Verify that errors thrown by the factory function are handled
      [{invalid: true}, ERROR_BAD_REQUEST],
    ]);
  });

  describe('json body - CustomClass - allowArray: true', function() {
    verifyTestCases({arg: 'anyname', type: 'CustomClass', allowArray: true}, [
      // normal objects is valid
      [{x: ''}],
      [{x: null}],
      [{x: {}}],
      [{x: {key: null}}],

      // array of objects also valid
      [[{}]],
      [[{x: ''}]],
      [[{x: null}]],
      [[{x: 1}, {y: 'string'}]],

      // array of non-objects are invalid
      [[{}, [{}]], ERROR_BAD_REQUEST],
      [[{}, 3.1415], ERROR_BAD_REQUEST],
      [[{}, 'non-object'], ERROR_BAD_REQUEST],
    ]);
  });
};
