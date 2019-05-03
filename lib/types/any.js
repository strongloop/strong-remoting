// Copyright IBM Corp. 2016,2017. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var debug = require('debug')('strong-remoting:http-coercion');
var g = require('strong-globalize')();
var numberChecks = require('../number-checks');
var looksLikeJson = require('../looks-like-json').looksLikeJson;

var MAX_SAFE_INTEGER = numberChecks.MAX_SAFE_INTEGER;
var MIN_SAFE_INTEGER = numberChecks.MIN_SAFE_INTEGER;

var IS_INT_REGEX = /^\-?(?:[0-9]|[1-9][0-9]*)$/;
var IS_FLOAT_REGEX = /^\-?([0-9]+)?\.[0-9]+$/;

module.exports = {
  fromTypedValue: function(ctx, value, options) {
    return {value: value};
  },

  fromSloppyValue: function(ctx, value, options) {
    if (value === 'null' || value === null)
      return {value: null};

    if (typeof value !== 'string')
      return {value: value};

    if (value === '') {
      // Pass on empty string as undefined.
      // undefined was chosen so that it plays well with ES6 default parameters.
      return {value: undefined};
    }

    if (value.toLowerCase() === 'true')
      return {value: true};

    if (value.toLowerCase() === 'false')
      return {value: false};

    if (IS_FLOAT_REGEX.test(value) || IS_INT_REGEX.test(value)) {
      var num = +value;
      // Cap at MAX_SAFE_INTEGER so we don't lose precision.
      if (MIN_SAFE_INTEGER <= num && num <= MAX_SAFE_INTEGER)
        value = num;
    }

    if (looksLikeJson(value)) {
      try {
        var result = JSON.parse(value);
        debug('parsed %j as JSON: %j', value, result);
        return this.fromTypedValue(ctx, result, options);
      } catch (ex) {
        debug('Cannot parse "any" value %j, assuming string. %s', value, ex);
        // no-op, use the original string value
      }
    }

    return this.fromTypedValue(ctx, value, options);
  },

  validate: function(ctx, value, options) {
    // no-op, all values are valid
  },
};
