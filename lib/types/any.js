// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var debug = require('debug')('strong-remoting:http-coercion');
var g = require('strong-globalize')();
var number = require('../number');

var IS_INT_REGEX = /^\-?(?:[0-9]|[1-9][0-9]*)$/;
var IS_FLOAT_REGEX = /^\-?([0-9]+)?\.[0-9]+$/;

var AnyTypeConverter = {
  fromTypedValue: function(value, typeReg, ctx) {
    return value;
  },

  fromSloppyValue: function(value, typeReg, ctx) {
    if (value === 'null' || value === null)
      return null;

    if (typeof value !== 'string')
      return value;

    if (value.toLowerCase() === 'true')
      return true;

    if (value.toLowerCase() === 'false')
      return false;

    if (IS_FLOAT_REGEX.test(val) || IS_INT_REGEX.test(val)) {
      var result = Number(val);
      // Cap at MAX_SAFE_INTEGER so we don't lose precision.
      if (result > number.MAX_SAFE_INTEGER || result < number.MIN_SAFE_INTEGER)
        result = value;
      return result;
    }

    return value;
  },

  validate: function (value, typeReg, ctx) {
    // no-op, all values are valid
  },
};

module.exports = AnyTypeConverter;
