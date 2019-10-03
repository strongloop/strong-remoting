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

  describe('json form - any - required', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'arg', type: 'any', required: true}, [
      // Valid values
      [{arg: 1234}, 1234],
      [{arg: 'text'}, 'text'],
      [{arg: 'undefined'}, 'undefined'],
      [{arg: 'null'}, 'null'],
      // Invalid (empty) values should trigger ERROR_BAD_REQUEST
      [EMPTY_BODY, ERROR_BAD_REQUEST],
      [{arg: ''}, ERROR_BAD_REQUEST],
      [{arg: null}, ERROR_BAD_REQUEST],
    ]);
  });

  describe('json form - any - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'arg', type: 'any'}, [
      // Empty values
      [EMPTY_BODY, undefined],
      [{arg: null}, null],
      [{arg: ''}, ''],

      // Valid values
      [{arg: false}, false],
      [{arg: true}, true],
      [{arg: 0}, 0],
      [{arg: 1}, 1],
      [{arg: -1}, -1],
      [{arg: 1.2}, 1.2],
      [{arg: -1.2}, -1.2],
      [{arg: 'text'}, 'text'],
      [{arg: []}, []],
      [{arg: {}}, {}],

      // Should `any` recognize date format?
      [{arg: '2016-05-19T13:28:51.299Z'}, '2016-05-19T13:28:51.299Z'],
      [{arg: '2016-05-19'}, '2016-05-19'],
      [{arg: 'Thu May 19 2016 15:28:51 GMT 0200 (CEST)'},
        'Thu May 19 2016 15:28:51 GMT 0200 (CEST)'],

      // Verify that deep coercion is not triggered
      // and types specified in JSON are preserved
      [{arg: 'null'}, 'null'],
      [{arg: 'false'}, 'false'],
      [{arg: 'true'}, 'true'],
      [{arg: '0'}, '0'],
      [{arg: '1'}, '1'],
      [{arg: '-1'}, '-1'],
      [{arg: '1.2'}, '1.2'],
      [{arg: '-1.2'}, '-1.2'],
      [{arg: '[]'}, '[]'],
      [{arg: '{}'}, '{}'],

      // Numberic strings larger than MAX_SAFE_INTEGER
      [{arg: '2343546576878989879789'}, '2343546576878989879789'],
      [{arg: '-2343546576878989879789'}, '-2343546576878989879789'],

      // Strings mimicking scientific notation
      [{arg: '1.234e+30'}, '1.234e+30'],
      [{arg: '-1.234e+30'}, '-1.234e+30'],
    ]);
  });
};
