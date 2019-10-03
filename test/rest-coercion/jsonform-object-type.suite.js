// Copyright IBM Corp. 2016,2017. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

const jsonFormContext = require('./_jsonform.context');
const customClassContext = require('./_custom-class.context.js');

module.exports = function(ctx) {
  ctx = customClassContext(jsonFormContext(ctx));
  const EMPTY_BODY = ctx.EMPTY_BODY;
  const ERROR_BAD_REQUEST = ctx.ERROR_BAD_REQUEST;
  const CustomClass = ctx.CustomClass;
  const verifyTestCases = ctx.verifyTestCases;

  describe('json form - CustomClass - required', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'arg', type: 'CustomClass', required: true}, [
      // Valid values
      [{arg: {}}, CustomClass({})],
      [{arg: {foo: 'bar'}}, CustomClass({foo: 'bar'})],

      // Empty values should trigger ERROR_BAD_REQUEST
      [EMPTY_BODY, ERROR_BAD_REQUEST],
      [{arg: null}, ERROR_BAD_REQUEST],
      [{arg: ''}, ERROR_BAD_REQUEST],

      // Arrays are not allowed
      [{arg: []}, ERROR_BAD_REQUEST],
      [{arg: [1, 2]}, ERROR_BAD_REQUEST],
    ]);
  });

  describe('json form - CustomClass - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'arg', type: 'CustomClass'}, [
      // Empty values
      [EMPTY_BODY, undefined],
      [{arg: null}, null],

      // Valid values
      [{arg: {name: null}}, CustomClass({name: null})],
      [{arg: {}}, CustomClass({})],
      [{arg: {name: 'value'}}, CustomClass({name: 'value'})],
      [{arg: {name: 1}}, CustomClass({name: 1})],

      // Verify that deep coercion is not triggered
      // and types specified in JSON are preserved
      [{arg: {name: '1'}}, CustomClass({name: '1'})],
      [{arg: {name: -1}}, CustomClass({name: -1})],
      [{arg: {name: '-1'}}, CustomClass({name: '-1'})],
      [{arg: {name: 1.2}}, CustomClass({name: 1.2})],
      [{arg: {name: '1.2'}}, CustomClass({name: '1.2'})],
      [{arg: {name: -1.2}}, CustomClass({name: -1.2})],
      [{arg: {name: '-1.2'}}, CustomClass({name: '-1.2'})],
      [{arg: {name: 'true'}}, CustomClass({name: 'true'})],
      [{arg: {name: 'false'}}, CustomClass({name: 'false'})],

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

      // Verify that errors thrown by the factory function are handled
      [{arg: {invalid: true}}, ERROR_BAD_REQUEST],
    ]);
  });
};
