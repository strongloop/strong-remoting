// Copyright IBM Corp. 2016,2017. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

const debug = require('debug')('strong-remoting:http-coercion');
const g = require('strong-globalize')();
const isSafeInteger = require('../number-checks').isSafeInteger;
const numberConverter = require('./number');

module.exports = {
  fromTypedValue: function(ctx, value, options) {
    const error = this.validate(ctx, value, options);
    return error ? {error: error} : {value: value};
  },

  fromSloppyValue: function(ctx, value, options) {
    const result = numberConverter.fromSloppyValue(ctx, value);
    if (result.error)
      return result;
    return this.fromTypedValue(ctx, result.value);
  },

  validate: function(ctx, value, options) {
    if (value === undefined)
      return null;

    let err = numberConverter.validate(ctx, value, options);
    if (err)
      return err;

    if (isSafeInteger(value))
      return null;

    err = new Error(g.f('Value is not a safe integer.'));
    err.statusCode = 400;
    return err;
  },
};
