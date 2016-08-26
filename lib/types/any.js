// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var debug = require('debug')('strong-remoting:http-coercion');
var g = require('strong-globalize')();
var numberChecks = require('../number-checks');

var MAX_SAFE_INTEGER = numberChecks.MAX_SAFE_INTEGER;
var MIN_SAFE_INTEGER = numberChecks.MIN_SAFE_INTEGER;

var IS_INT_REGEX = /^\-?(?:[0-9]|[1-9][0-9]*)$/;
var IS_FLOAT_REGEX = /^\-?([0-9]+)?\.[0-9]+$/;

module.exports = {
  fromTypedValue: function(ctx, value) {
    return { value: value };
  },

  fromSloppyValue: function(ctx, value) {
    if (value === 'null' || value === null)
      return { value: null };

    if (typeof value !== 'string')
      return { value: value };

    if (value === '') {
      // Pass on empty string as undefined.
      // undefined was chosen so that it plays well with ES6 default parameters.
      return { value: undefined };
    }

    if (value.toLowerCase() === 'true')
      return { value: true };

    if (value.toLowerCase() === 'false')
      return { value: false };

    if (IS_FLOAT_REGEX.test(value) || IS_INT_REGEX.test(value)) {
      var num = +value;
      // Cap at MAX_SAFE_INTEGER so we don't lose precision.
      if (MIN_SAFE_INTEGER <= num && num <= MAX_SAFE_INTEGER)
        value = num;
    }

    return { value: value };
  },

  validate: function (ctx, value) {
    // no-op, all values are valid
  },
};
