// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var debug = require('debug')('strong-remoting:http-coercion');
var g = require('strong-globalize')();
var isSafeInteger = require('../number-checks').isSafeInteger;
var numberConverter = require('./number');

module.exports = {
  fromTypedValue: function(ctx, value, options) {
    var error = this.validate(ctx, value, options);
    return error ? {error: error} : {value: value};
  },

  fromSloppyValue: function(ctx, value, options) {
    var result = numberConverter.fromSloppyValue(ctx, value);
    if (result.error)
      return result;
    return this.fromTypedValue(ctx, result.value);
  },

  validate: function(ctx, value, options) {
    if (value === undefined)
      return null;

    var err = numberConverter.validate(ctx, value, options);
    if (err)
      return err;

    if (isSafeInteger(value))
      return null;

    err = new Error(g.f('Value is not a safe integer.'));
    err.statusCode = 400;
    return err;
  },
};
