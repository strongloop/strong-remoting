// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var debug = require('debug')('strong-remoting:http-coercion');
var g = require('strong-globalize')();
var looksLikeJsonObject = require('../looks-like-json').looksLikeJsonObject;

module.exports = {
  fromTypedValue: function(ctx, value) {
    var error = this.validate(ctx, value);
    return error ? { error: error } : { value: value };
  },

  fromSloppyValue: function(ctx, value) {
    if (value === undefined || value === '') {
      // undefined was chosen so that it plays well with ES6 default parameters.
      return { value: undefined };
    }

    if (value === null || value === 'null')
      return { value: null };

    if (looksLikeJsonObject(value)) {
      try {
        var result = JSON.parse(value);
        debug('parsed %j as JSON: %j', value, result);
        return this.fromTypedValue(ctx, result);
      } catch (ex) {
        debug('Cannot parse object value %j. %s', value, ex);
        var err = new Error(g.f('Cannot parse JSON-encoded object value.'));
        err.statusCode = 400;
        return { error: err };
      }
    }

    // NOTE: nested values in objects are intentionally not coerced
    return this.fromTypedValue(ctx, value);
  },

  validate: function(ctx, value) {
    if (value === undefined || value === null)
      return null;

    if (typeof value !== 'object')
      return errorNotAnObject();

    // reject object-like values that have their own strong-remoting type

    if (Array.isArray(value))
      return errorNotAnObject();

    if (value instanceof Date)
      return errorNotAnObject();

    return null;
  },
};

function errorNotAnObject() {
  var err = new Error(g.f('Value is not an object.'));
  err.statusCode = 400;
  return err;
}
