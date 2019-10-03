// Copyright IBM Corp. 2016,2017. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

const jsonFormContext = require('./_jsonform.context');

module.exports = function(ctx) {
  ctx = jsonFormContext(ctx);
  const EMPTY_BODY = ctx.EMPTY_BODY;
  const ERROR_BAD_REQUEST = ctx.ERROR_BAD_REQUEST;
  const verifyTestCases = ctx.verifyTestCases;

  describe('json form - object - required', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'arg', type: 'object', required: true}, [
      // Valid values
      [{arg: {}}, {}],
      [{arg: {foo: 'bar'}}, {foo: 'bar'}],

      // Empty values should trigger ERROR_BAD_REQUEST
      [EMPTY_BODY, ERROR_BAD_REQUEST],
      [{arg: null}, ERROR_BAD_REQUEST],
      [{arg: ''}, ERROR_BAD_REQUEST],

      // Arrays are not allowed
      [{arg: []}, ERROR_BAD_REQUEST],
      [{arg: [1, 2]}, ERROR_BAD_REQUEST],
    ]);
  });

  describe('json form - object - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'arg', type: 'object'}, [
      // Empty values
      [EMPTY_BODY, undefined],
      [{arg: null}, null],

      // Valid values
      [{arg: {x: null}}, {x: null}],
      [{arg: {}}, {}],
      [{arg: {x: 'value'}}, {x: 'value'}],
      [{arg: {x: 1}}, {x: 1}],

      // Verify that deep coercion is not triggered
      // and types specified in JSON are preserved
      [{arg: {x: '1'}}, {x: '1'}],
      [{arg: {x: -1}}, {x: -1}],
      [{arg: {x: '-1'}}, {x: '-1'}],
      [{arg: {x: 1.2}}, {x: 1.2}],
      [{arg: {x: '1.2'}}, {x: '1.2'}],
      [{arg: {x: -1.2}}, {x: -1.2}],
      [{arg: {x: '-1.2'}}, {x: '-1.2'}],
      [{arg: {x: 'true'}}, {x: 'true'}],
      [{arg: {x: 'false'}}, {x: 'false'}],

      // Invalid values should trigger ERROR_BAD_REQUEST
      [{arg: ''}, ERROR_BAD_REQUEST],
      [{arg: false}, ERROR_BAD_REQUEST],
      [{arg: true}, ERROR_BAD_REQUEST],
      [{arg: 0}, ERROR_BAD_REQUEST],
      [{arg: 1}, ERROR_BAD_REQUEST],
      [{arg: -1}, ERROR_BAD_REQUEST],

      // Arrays are not allowed
      [{arg: []}, ERROR_BAD_REQUEST],
      [{arg: ['text']}, ERROR_BAD_REQUEST],
      [{arg: [1, 2]}, ERROR_BAD_REQUEST],
    ]);
  });

  describe('json form - object - allowArray: true', function() {
    verifyTestCases({arg: 'arg', type: 'object', allowArray: true}, [
      // normal objects is valid
      [{arg: {x: null}}, {x: null}],
      [{arg: {}}, {}],
      [{arg: {x: 'value'}}, {x: 'value'}],
      [{arg: {x: 1}}, {x: 1}],

      // array of objects also valid
      [{arg: [{}]}, [{}]],
      [{arg: [{x: 1}, {}]}, [{x: 1}, {}]],
      [{arg: [{x: null}]}, [{x: null}]],

      // Invalid values should trigger ERROR_BAD_REQUEST
      [{arg: ''}, ERROR_BAD_REQUEST],
      [{arg: false}, ERROR_BAD_REQUEST],
      [{arg: true}, ERROR_BAD_REQUEST],
      [{arg: 0}, ERROR_BAD_REQUEST],
      [{arg: 1}, ERROR_BAD_REQUEST],
      [{arg: -1}, ERROR_BAD_REQUEST],

      // array of non-objects are invalid
      [{arg: [{}, [{}]]}, ERROR_BAD_REQUEST],
      [{arg: [{}, 3.1415]}, ERROR_BAD_REQUEST],
      [{arg: [{}, 'non-object']}, ERROR_BAD_REQUEST],
    ]);
  });
};
