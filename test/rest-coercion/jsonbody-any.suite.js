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

  describe('json body - any - required', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'anyname', type: 'any', required: true}, [
      [null, ERROR_BAD_REQUEST],
      // Both empty array and empty object are valid values for "any"
      [[]],
      [{}],
      // Other valid values
      [false],
      [1],
      // To send a string in a JSON body, one has to manually encode it,
      // because supertest sends string data verbatim
      ['"text"', 'text'],
      [{x: null}],
      [[1]],
    ]);
  });

  describe('json body - any - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'anyname', type: 'any'}, [
      // Empty values
      [null, null],

      // Valid values
      [false],
      [1],
      ['"text"', 'text'],

      // Dates are not recognized/parsed
      ['"2016-05-19T13:28:51.299Z"', '2016-05-19T13:28:51.299Z'],

      [[]],
      [{}],

      // Verify that deep coercion is not triggered
      // and types specified in JSON are preserved

      [{x: null}],
      [[null]],
      [{x: 'null'}],
      [['null']],

      [{x: false}],
      [[false]],
      [{x: 'false'}],
      [['false']],

      [{x: ''}],
      [['']],

      [{x: true}],
      [[true]],
      [{x: 'true'}],
      [['true']],

      [{x: 0}],
      [[0]],
      [{x: '0'}],
      [['0']],

      [{x: 1}],
      [[1]],
      [{x: '1'}],
      [['1']],

      [{x: -1}],
      [[-1]],
      [{x: '-1'}],
      [['-1']],

      [{x: 1.2}],
      [[1.2]],
      [{x: '1.2'}],
      [['1.2']],

      [{x: -1.2}],
      [[-1.2]],
      [{x: '-1.2'}],
      [['-1.2']],

      [{x: 'text'}],
      [['text']],

      [{x: []}],
      [[[]]],
      [{x: '[]'}],
      [['[]']],

      [{x: {}}],
      [[{}]],
      [{x: '{}'}],
      [['{}']],

      // Numeric strings larger than MAX_SAFE_INTEGER
      [{x: '2343546576878989879789'}],
      [['2343546576878989879789']],
      [{x: '-2343546576878989879789'}],
      [['-2343546576878989879789']],

      // Strings mimicking scientific notation
      [{x: '1.234e+30'}],
      [['1.234e+30']],
      [{x: '-1.234e+30'}],
      [['-1.234e+30']],

      // Should `any` recognize date?
      [{x: '2016-05-19T13:28:51.299Z'}],
      [['2016-05-19T13:28:51.299Z']],
      [{x: '2016-05-19'}],
      [['2016-05-19']],
      [{x: 'Thu May 19 2016 15:28:51 GMT 0200 (CEST)'}],
      [['Thu May 19 2016 15:28:51 GMT 0200 (CEST)']],
    ]);
  });
};
