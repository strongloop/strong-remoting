// Copyright IBM Corp. 2016,2017. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

const urlEncodedContext = require('./_urlencoded.context');

module.exports = function(ctx) {
  suite('query string', urlEncodedContext(ctx, 'qs'));
  suite('form data', urlEncodedContext(ctx, 'form'));
};

function suite(prefix, ctx) {
  const EMPTY_QUERY = ctx.EMPTY_QUERY;
  const ERROR_BAD_REQUEST = ctx.ERROR_BAD_REQUEST;
  const verifyTestCases = ctx.verifyTestCases;

  describe(prefix + ' - object - required', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'arg', type: 'object', required: true}, [
      // Valid values - JSON encoding
      ['arg={}', {}],
      ['arg={"foo":"bar"}', {foo: 'bar'}],

      // Valid values - nested keys
      ['arg[key]=undefined', {key: 'undefined'}],
      ['arg[key]=null', {key: 'null'}],
      ['arg[key]=text', {key: 'text'}],

      // Empty values should trigger ERROR_BAD_REQUEST
      [EMPTY_QUERY, ERROR_BAD_REQUEST],
      ['arg', ERROR_BAD_REQUEST],
      ['arg=', ERROR_BAD_REQUEST],
      // Empty-like values should trigger ERROR_BAD_REQUEST too
      ['arg=null', ERROR_BAD_REQUEST],
      ['arg=undefined', ERROR_BAD_REQUEST],

      // Arrays are not allowed
      ['arg=[]', ERROR_BAD_REQUEST],
      ['arg=[1,2]', ERROR_BAD_REQUEST],
    ]);
  });

  describe(prefix + ' - object - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'arg', type: 'object'}, [
      // Empty values
      [EMPTY_QUERY, undefined],
      ['arg', undefined],
      ['arg=', undefined],
      ['arg=null', null],
      ['arg={}', {}],

      // Valid values - nested keys
      // Nested values are NOT coerced (no deep coercion)
      ['arg[key]=undefined', {key: 'undefined'}],
      ['arg[key]=null', {key: 'null'}],
      ['arg[key]=value', {key: 'value'}],
      ['arg[key]=0', {key: '0'}],
      ['arg[key]=1', {key: '1'}],
      ['arg[key]=-1', {key: '-1'}],
      ['arg[key]=1.2', {key: '1.2'}],
      ['arg[key]=-1.2', {key: '-1.2'}],
      ['arg[key]=true', {key: 'true'}],
      ['arg[key]=false', {key: 'false'}],
      ['arg[x]=a&arg[y]=b', {x: 'a', y: 'b'}],
      ['arg[key]=[1,2]', {key: '[1,2]'}],
      ['arg[key]=1&arg[key]=2', {key: ['1', '2']}],
      // Numbers larger than MAX_SAFE_INTEGER are kept as strings
      ['arg[key]=2343546576878989879789', {key: '2343546576878989879789'}],
      ['arg[key]=-2343546576878989879789', {key: '-2343546576878989879789'}],
      // Scientific notation is not parsed
      ['arg[key]=1.234e%2B30', {key: '1.234e+30'}],
      ['arg[key]=-1.234e%2B30', {key: '-1.234e+30'}],
      // Dates are preserved in string
      ['arg[key]=2016-05-19T13:28:51.299Z',
        {key: '2016-05-19T13:28:51.299Z'}],
      ['arg[a]=2016-05-19T13:28:51.299Z&arg[b]=2016-05-20T08:27:28.539Z', {
        a: '2016-05-19T13:28:51.299Z',
        b: '2016-05-20T08:27:28.539Z',
      }],

      // Valid values - JSON encoding
      ['arg={"key":null}', {key: null}],
      ['arg={"key":"value"}', {key: 'value'}],
      ['arg={"key":false}', {key: false}],
      ['arg={"key":true}', {key: true}],
      ['arg={"key":0}', {key: 0}],
      ['arg={"key":1}', {key: 1}],
      ['arg={"key":-1}', {key: -1}],
      ['arg={"key":1.2}', {key: 1.2}],
      ['arg={"key":-1.2}', {key: -1.2}],
      // Nested values are NOT coerced (no deep coercion)
      ['arg={"key":"false"}', {key: 'false'}],
      ['arg={"key":"true"}', {key: 'true'}],
      ['arg={"key":"0"}', {key: '0'}],
      ['arg={"key":"1"}', {key: '1'}],
      ['arg={"key":"-1"}', {key: '-1'}],
      ['arg={"key":"1.2"}', {key: '1.2'}],
      ['arg={"key":"-1.2"}', {key: '-1.2'}],

      // Arrays are not allowed
      ['arg=[]', ERROR_BAD_REQUEST],
      ['arg=[1,2]', ERROR_BAD_REQUEST],
      ['arg=[1,"text"]', ERROR_BAD_REQUEST],
      ['arg=["text"]', ERROR_BAD_REQUEST],

      // Invalid values should trigger ERROR_BAD_REQUEST
      ['arg=undefined', ERROR_BAD_REQUEST],
      ['arg=false', ERROR_BAD_REQUEST],
      ['arg=true', ERROR_BAD_REQUEST],
      ['arg=0', ERROR_BAD_REQUEST],
      ['arg=1', ERROR_BAD_REQUEST],
      ['arg=-1', ERROR_BAD_REQUEST],
      ['arg=text', ERROR_BAD_REQUEST],
      ['arg={malformed}', ERROR_BAD_REQUEST],
      ['arg=[malformed]', ERROR_BAD_REQUEST],
    ]);
  });
}
