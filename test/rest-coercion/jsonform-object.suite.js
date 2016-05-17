// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var jsonFormContext = require('./_jsonform.context');

module.exports = function(ctx) {
  ctx = jsonFormContext(ctx);
  var EMPTY_BODY = ctx.EMPTY_BODY;
  var ERROR_BAD_REQUEST = ctx.ERROR_BAD_REQUEST;
  var verifyTestCases = ctx.verifyTestCases;

  describe('json form - object - required', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({ arg: 'arg', type: 'object', required: true }, [
      // Valid values
      [{ arg: {}}, {}],
      [{ arg: { foo: 'bar' }}, { foo: 'bar' }],
      // Arrays are objects too
      [{ arg: [] }, []],
      [{ arg: [1, 2] }, [1, 2]],

      // Empty values should trigger ERROR_BAD_REQUEST
      [EMPTY_BODY, ERROR_BAD_REQUEST],
      [{ arg: null }, ERROR_BAD_REQUEST],
      [{ arg: '' }, ERROR_BAD_REQUEST],
    ]);
  });

  describe('json form - object - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({ arg: 'arg', type: 'object' }, [
      // Empty values
      [EMPTY_BODY, undefined],
      [{ arg: null }, ERROR_BAD_REQUEST], // should be null

      // Valid values
      [{ arg: { x: null }}, { x: null }],
      [{ arg: {}}, {}],
      [{ arg: { x: 'value' }}, { x: 'value' }],
      [{ arg: { x: 1 }}, { x: 1 }],

      // Arrays are objects too
      [{ arg: [] }, []],
      [{ arg: ['text'] }, ['text']],
      [{ arg: [1, 2] }, [1, 2]],

      // Verify that deep coercion is not triggered
      // and types specified in JSON are preserved
      [{ arg: { x: '1' }}, { x: '1' }],
      [{ arg: { x: -1 }}, { x: -1 }],
      [{ arg: { x: '-1' }}, { x: '-1' }],
      [{ arg: { x: 1.2 }}, { x: 1.2 }],
      [{ arg: { x: '1.2' }}, { x: '1.2' }],
      [{ arg: { x: -1.2 }}, { x: -1.2 }],
      [{ arg: { x: '-1.2' }}, { x: '-1.2' }],
      [{ arg: { x: 'true' }}, { x: 'true' }],
      [{ arg: { x: 'false' }}, { x: 'false' }],

      // Invalid values should trigger ERROR_BAD_REQUEST
      [{ arg: '' }, ERROR_BAD_REQUEST],
      [{ arg: false }, ERROR_BAD_REQUEST],
      [{ arg: true }, ERROR_BAD_REQUEST],
      [{ arg: 0 }, ERROR_BAD_REQUEST],
      [{ arg: 1 }, ERROR_BAD_REQUEST],
      [{ arg: -1 }, ERROR_BAD_REQUEST],
    ]);
  });
};
