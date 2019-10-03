// Copyright IBM Corp. 2016,2017. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

const urlEncodedContext = require('./_urlencoded.context');
const customClassContext = require('./_custom-class.context.js');

module.exports = function(ctx) {
  suite('query string', urlEncodedContext(ctx, 'qs'));
  suite('form data', urlEncodedContext(ctx, 'form'));
};

function suite(prefix, ctx) {
  ctx = customClassContext(ctx);
  const EMPTY_QUERY = ctx.EMPTY_QUERY;
  const ERROR_BAD_REQUEST = ctx.ERROR_BAD_REQUEST;
  const CustomClass = ctx.CustomClass;
  const verifyTestCases = ctx.verifyTestCases;

  describe(prefix + ' - CustomClass - required', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'arg', type: 'CustomClass', required: true}, [
      // Valid values - JSON encoding
      ['arg={}', CustomClass({})],
      ['arg={"name":"bar"}', CustomClass({name: 'bar'})],

      // Valid values - nested keys
      ['arg[name]=undefined', CustomClass({name: 'undefined'})],
      ['arg[name]=null', CustomClass({name: 'null'})],
      ['arg[name]=text', CustomClass({name: 'text'})],

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

  describe(prefix + ' - CustomClass - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'arg', type: 'CustomClass'}, [
      // Empty values
      [EMPTY_QUERY, undefined],
      ['arg', undefined],
      ['arg=', undefined],
      ['arg=null', null],
      ['arg={}', CustomClass({})],

      // Valid values - nested keys
      // Nested values are NOT coerced (no deep coercion)
      ['arg[name]=undefined', CustomClass({name: 'undefined'})],
      ['arg[name]=null', CustomClass({name: 'null'})],
      ['arg[name]=value', CustomClass({name: 'value'})],
      ['arg[name]=0', CustomClass({name: '0'})],
      ['arg[name]=1', CustomClass({name: '1'})],
      ['arg[name]=-1', CustomClass({name: '-1'})],
      ['arg[name]=1.2', CustomClass({name: '1.2'})],
      ['arg[name]=-1.2', CustomClass({name: '-1.2'})],
      ['arg[name]=true', CustomClass({name: 'true'})],
      ['arg[name]=false', CustomClass({name: 'false'})],
      ['arg[x]=a&arg[y]=b', CustomClass({x: 'a', y: 'b'})],
      ['arg[name]=[1,2]', CustomClass({name: '[1,2]'})],
      ['arg[name]=1&arg[name]=2', CustomClass({name: ['1', '2']})],

      // Valid values - JSON encoding
      ['arg={"name":null}', CustomClass({name: null})],
      ['arg={"name":"value"}', CustomClass({name: 'value'})],
      ['arg={"name":false}', CustomClass({name: false})],
      ['arg={"name":true}', CustomClass({name: true})],
      ['arg={"name":0}', CustomClass({name: 0})],
      ['arg={"name":1}', CustomClass({name: 1})],
      ['arg={"name":-1}', CustomClass({name: -1})],
      ['arg={"name":1.2}', CustomClass({name: 1.2})],
      ['arg={"name":-1.2}', CustomClass({name: -1.2})],
      // Nested values are NOT coerced (no deep coercion)
      ['arg={"name":"false"}', CustomClass({name: 'false'})],
      ['arg={"name":"true"}', CustomClass({name: 'true'})],
      ['arg={"name":"0"}', CustomClass({name: '0'})],
      ['arg={"name":"1"}', CustomClass({name: '1'})],
      ['arg={"name":"-1"}', CustomClass({name: '-1'})],
      ['arg={"name":"1.2"}', CustomClass({name: '1.2'})],
      ['arg={"name":"-1.2"}', CustomClass({name: '-1.2'})],

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

      // arrays are not allowed
      ['arg=[]', ERROR_BAD_REQUEST],
      ['arg=["text"]', ERROR_BAD_REQUEST],
      ['arg=[1,2]', ERROR_BAD_REQUEST],
      ['arg=[1,"text"]', ERROR_BAD_REQUEST],

      // Verify that errors thrown by the factory function are handled
      ['arg[invalid]=true', ERROR_BAD_REQUEST],
    ]);
  });
}
