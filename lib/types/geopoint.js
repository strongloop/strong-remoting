// Copyright IBM Corp. 2016,2017. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var debug = require('debug')('strong-remoting:http-coercion');
var g = require('strong-globalize')();
var GeoPoint = require('loopback-datatype-geopoint');
var looksLikeJson = require('../looks-like-json').looksLikeJson;

module.exports = {
  fromTypedValue: function(ctx, value, options) {
    if (value === undefined)
      return {value: value};
    var error = this.validate(ctx, value, options);
    return error ? {error: error} : {value: new GeoPoint(value)};
  },

  fromSloppyValue: function(ctx, value, options) {
    if (value === undefined || value === '') {
      // undefined was chosen so that it plays well with ES6 default parameters.
      return {value: undefined};
    }

    if (value === null || value === 'null')
      return {value: null};

    if (looksLikeJson(value)) {
      const result = parseJson(value);
      if (result instanceof Error) return {error: result};
      return this.fromTypedValue(ctx, result, options);
    }

    // coerce input from 'arg[lat]=2.5&arg[lng]=2' or 'arg[0]=2.5&arg[1]=2
    if (typeof value === 'object') {
      const result = coerceArrayOrObject(value);
      return this.fromTypedValue(ctx, result, options);
    }
    return this.fromTypedValue(ctx, value, options);
  },

  validate: function(ctx, value, options) {
    if (value === undefined)
      return null;
    try {
      new GeoPoint(value);
      return null;
    } catch (e) {
      var err = new Error(e.message);
      err.statusCode = 400;
      return err;
    }
  },
};

function parseJson(value) {
  try {
    var result = JSON.parse(value);
    debug('parsed %j as JSON: %j', value, result);
    return result;
  } catch (ex) {
    debug('Cannot parse object value %j. %s', value, ex);
    var err = new Error(g.f('Cannot parse JSON-encoded object value.'));
    err.statusCode = 400;
    return err;
  }
}

function coerceArrayOrObject(value) {
  var result = {};

  if (Array.isArray(value)) {
    return value.map(Number);
  }

  for (var key in value) {
    var val = value[key];
    result[key] = Number(val);
  }
  return result;
}
