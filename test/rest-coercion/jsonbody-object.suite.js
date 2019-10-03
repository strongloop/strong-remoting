// Copyright IBM Corp. 2016,2017. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

const jsonBodyContext = require('./_jsonbody.context');

module.exports = function(ctx) {
  ctx = jsonBodyContext(ctx);
  const ERROR_BAD_REQUEST = ctx.ERROR_BAD_REQUEST;
  const verifyTestCases = ctx.verifyTestCases;

  describe('json body - object - required', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'anyname', type: 'object', required: true}, [
      // Valid values, arrays are objects too
      [{}], // an empty object is a valid value too
      [{x: ''}],
      [{x: null}],

      // Invalid values trigger ERROR_BAD_REQUEST
      [null, ERROR_BAD_REQUEST],

      // Arrays are not allowed
      [[], ERROR_BAD_REQUEST],
      [[1, 2], ERROR_BAD_REQUEST],
    ]);
  });

  describe('json body - object - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'anyname', type: 'object'}, [
      // Empty values
      [null, null],

      // Valid values
      [{}],

      // Verify that deep coercion is not triggered
      // and types specified in JSON are preserved

      [{x: ''}],
      [{x: null}],
      [{x: {}}],
      [{x: {key: null}}],
      [{x: 'value'}],
      [{x: 1}],
      [{x: '1'}],
      [{x: -1}],
      [{x: '-1'}],
      [{x: 1.2}],
      [{x: '1.2'}],
      [{x: -1.2}],
      [{x: '-1.2'}],
      [{x: ['text']}],
      [{x: [1, 2]}],

      // Numeric strings larger than MAX_SAFE_INTEGER
      [{x: '2343546576878989879789'}],
      [{x: '-2343546576878989879789'}],

      // Strings mimicking scientific notation
      [{x: '1.234e+30'}],
      [{x: '-1.234e+30'}],

      // Should we deep-coerce date values?
      [{x: '2016-05-19T13:28:51.299Z'}],
      [{x: '2016-05-19'}],
      [{x: 'Thu May 19 2016 15:28:51 GMT 0200 (CEST)'}],

      // Arrays are not allowed
      [[], ERROR_BAD_REQUEST],
      [[1, 2], ERROR_BAD_REQUEST],
    ]);
  });

  describe('json body - object - allowArray: true', function() {
    verifyTestCases({arg: 'data', type: 'object', allowArray: true}, [
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
