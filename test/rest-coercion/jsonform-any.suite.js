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

  describe('json form - any - required', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({ arg: 'arg', type: 'any', required: true }, [
      // Valid values
      [{ arg: 1234 }, 1234],
      [{ arg: 'text' }, 'text'],
      [{ arg: 'undefined' }, 'undefined'],
      // Invalid (empty) values should trigger ERROR_BAD_REQUEST
      [EMPTY_BODY, ERROR_BAD_REQUEST],
      [{ arg: '' }, ''],
      [{ arg: null }, null],
      [{ arg: 'null' }, null],
    ]);
  });

  describe('json form - any - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({ arg: 'arg', type: 'any' }, [
      // Empty values
      [EMPTY_BODY, undefined],
      [{ arg: null }, null],
      [{ arg: '' }, ''],

      // Valid values
      [{ arg: false }, false],
      [{ arg: true }, true],
      [{ arg: 0 }, 0],
      [{ arg: 1 }, 1],
      [{ arg: -1 }, -1],
      [{ arg: 1.2 }, 1.2],
      [{ arg: -1.2 }, -1.2],
      [{ arg: 'text' }, 'text'],
      [{ arg: [] }, []],
      [{ arg: {}}, {}],

      // Should `any` recognize date format?
      [{ arg: '2016-05-19T13:28:51.299Z' }, '2016-05-19T13:28:51.299Z'],
      [{ arg: '2016-05-19' }, '2016-05-19'],
      [{ arg: 'Thu May 19 2016 15:28:51 GMT 0200 (CEST)' },
        'Thu May 19 2016 15:28:51 GMT 0200 (CEST)'],

      // Verify that deep coercion is not triggered
      // and types specified in JSON are preserved
      [{ arg: 'null' }, null], // should be string 'null'
      [{ arg: 'false' }, false], // should be string 'false'
      [{ arg: 'true' }, true], // should be string 'true'
      [{ arg: '0' }, '0'],
      [{ arg: '1' }, 1], // should be string '1'
      [{ arg: '-1' }, '-1'],
      [{ arg: '1.2' }, 1.2], // should be string '1.2'
      [{ arg: '-1.2' }, '-1.2'], // should be -1.2 (number)
      [{ arg: '[]' }, '[]'],
      [{ arg: '{}' }, '{}'],

      // Numberic strings larger than MAX_SAFE_INTEGER
      // the following should be string '2343546576878989879789'
      [{ arg: '2343546576878989879789' }, 2.34354657687899e+21],
      [{ arg: '-2343546576878989879789' }, '-2343546576878989879789'],

      // Strings mimicking scientific notation
      [{ arg: '1.234e+30' }, '1.234e+30'],
      [{ arg: '-1.234e+30' }, '-1.234e+30'],
    ]);
  });
};
