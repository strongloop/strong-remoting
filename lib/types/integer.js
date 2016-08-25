// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var debug = require('debug')('strong-remoting:http-coercion');
var g = require('strong-globalize')();
var isSafeInteger = require('../number').isSafeInteger;
var numberConverter = require('./number');

module.exports = {
  fromTypedValue: function(value, typeRegistry, ctx) {
    var error = this.validate(value);
    return error ? { error: error } : { value: value };
  },

  fromSloppyValue: function(value, typeRegistry, ctx) {
    var result = numberConverter.fromSloppyValue(value, typeRegistry, ctx);
    return this.fromTypedValue(result);
  },

  validate: function(value, typeRegistry, ctx) {
    if (value === undefined)
      return null;

    var err = numberConverter.validate(value, typeRegistry, ctx);
    if (err)
      return err;

    if (!isSafeInteger(value))
      return new Error(g.f('Value is not a safe integer'));

    return null;
  },
};
