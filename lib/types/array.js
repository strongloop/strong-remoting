// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var assert = require('assert');
var debug = require('debug')('strong-remoting:http-coercion');
var escapeRegex = require('escape-string-regexp');
var g = require('strong-globalize')();
var looksLikeJsonArray = require('../looks-like-json').looksLikeJsonArray;

module.exports = ArrayConverter;

function ArrayConverter(itemType) {
  this._itemType = itemType;
}

ArrayConverter.prototype.fromTypedValue = function(ctx, value, options) {
  if (value === undefined || value === null)
    return {value: value};

  if (!Array.isArray(value))
    return {error: notAnArrayError()};

  var items = new Array(value.length);
  var itemResult;
  var itemConverter = ctx.typeRegistry.getConverter(this._itemType);

  for (var ix in value) {
    itemResult = itemConverter.fromTypedValue(ctx, value[ix], options);
    itemResult = validateConverterResult(itemResult);
    debug('typed item result: %j -> %j as %s',
      value[ix], itemResult, this._itemType);

    if (itemResult.error)
      return itemResult;
    items[ix] = itemResult.value;
  }
  return {value: items};
};

ArrayConverter.prototype.fromSloppyValue = function(ctx, value, options) {
  if (value === undefined || value === '') {
    // undefined was chosen so that it plays well with ES6 default parameters.
    return {value: undefined};
  }

  if (value === null || value === 'null') {
    return {value: null};
  }

  return this._fromTypedValueString(ctx, value, options) ||
    this._fromDelimitedString(ctx, value, options) ||
    this._fromSloppyData(ctx, value, options);
};

ArrayConverter.prototype._fromTypedValueString = function(ctx, value, options) {
  if (!looksLikeJsonArray(value))
    return null;

  // If it looks like a JSON array, try to parse it.
  try {
    var result = JSON.parse(value);
    debug('parsed %j as JSON: %j', value, result);
    return this.fromTypedValue(ctx, result, options);
  } catch (ex) {
    debug('Cannot parse array value %j. %s', value, ex);
    var err = new Error(g.f('Cannot parse JSON-encoded array value.'));
    err.statusCode = 400;
    return {error: err};
  }
};

ArrayConverter.prototype._fromDelimitedString = function(ctx, value, options) {
  if (typeof value !== 'string')
    return null;

  // The user may set delimiters like ',', or ';' to designate array items
  // for easier usage.
  var delims = ctx.options && ctx.options.arrayItemDelimiters;
  if (!delims)
    return null;

  // Construct delimiter regex if input was an array. Overwrite option
  // so this only needs to happen once.
  if (Array.isArray(delims)) {
    delims = new RegExp(delims.map(escapeRegex).join('|'), 'g');
    ctx.options.arrayItemDelimiters = delims;
  }

  var items = value.split(delims);

  // perform sloppy-string coercion
  return this.fromSloppyValue(ctx, items, options);
};

ArrayConverter.prototype._fromSloppyData = function(ctx, value, options) {
  if (!Array.isArray(value)) {
    // Alright, not array-like, just wrap it in an array on the way out.
    value = [value];
  }

  debug('Intermediate sloppy array result: %j', value);

  var items = new Array(value.length);
  var itemResult;
  var itemConverter = ctx.typeRegistry.getConverter(this._itemType);

  for (var ix in value) {
    itemResult = itemConverter.fromSloppyValue(ctx, value[ix], options);
    itemResult = validateConverterResult(itemResult);
    debug('item %d: sloppy converted %j to %j', ix, value[ix], itemResult);
    if (itemResult.error)
      return itemResult;
    items[ix] = itemResult.value;
  }
  return {value: items};
};

ArrayConverter.prototype.validate = function(ctx, value, options) {
  if (value === undefined || value === null)
    return null;

  if (!Array.isArray(value))
    return notAnArrayError();

  var itemConverter = ctx.typeRegistry.getConverter(this._itemType);
  var itemError;
  for (var ix in value) {
    itemError = itemConverter.validate(ctx, value[ix], options);
    if (itemError) return itemError;
  }
};

function notAnArrayError() {
  var err = new Error(g.f('Value is not an array.'));
  err.statusCode = 400;
  return err;
}

function validateConverterResult(result) {
  var isValid = typeof result === 'object' &&
      ('error' in result || 'value' in result);
  if (isValid)
    return result;

  var err = new (assert.AssertionError)({
    message:
      'Type conversion result should have "error" or "value" property. ' +
      'Got ' + JSON.stringify(result) + ' instead.',
  });
  return {error: err};
}
