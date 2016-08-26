// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var debug = require('debug')('strong-remoting:http-coercion');
var escapeRegex = require('escape-string-regexp');
var g = require('strong-globalize')();

module.exports = function ArrayConverter(itemType) {
  this._itemType = itemType;
};

ArrayConverter.prototype.fromTypedValue = function(ctx, value) {
  if (!Array.isArray(value))
    return { error: notAnArrayError() };

  var items = new Array(value.length);
  var itemResult;
  var itemConverter = ctx.typeRegistry.getConverter(this._itemType);

  for (var ix in value) {
    itemResult = itemConverter.fromTypedValue(value[ix]);
    if (itemResult.error)
      return itemResult;
    items[ix] = itemResult.value;
  }
  return { value: items };
};

ArrayConverter.prototype.fromSloppyValue = function(ctx, value) {
  return this._fromTypedValueString(ctx, value) ||
    this._fromDelimitedString(ctx, value) ||
    this._fromSloppyData(ctx, value);
};

ArrayConverter.prototype._fromTypedValueString = function(ctx, value) {
  if (typeof value !== 'string' || value[0] !== '[')
    return null;

  // If it looks like a JSON array, try to parse it.
  try {
    var result = JSON.parse(value);
    return this.fromTypedValue(ctx, result);
  } catch (ex) {
    debug(
      'Cannot parse array value %j, falling back to sloppy coercion. %s',
      value, ex);
    return null;
  }
};

ArrayConverter.prototype._fromDelimitedString = function(ctx, value) {
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
  return this.fromSloppyValue(ctx, items);
};

ArrayConverter.prototype._fromSloppyData = function(ctx, value) {
  if (!Array.isArray(value)) {
    // Alright, not array-like, just wrap it in an array on the way out.
    value = [value];
  }

  var items = new Array(result.length);
  var itemResult;
  var itemConverter = ctx.typeRegistry.getConverter(this._itemType);

  for (var ix in value) {
    itemResult = itemConverter.fromSloppyValue(value[ix]);
    if (itemResult.error)
      return itemResult;
    items[ix] = itemResult.value;
  }
  return { value: items };
};

ArrayConverter.prototype.validate = function(ctx, value) {
  if (!Array.isArray(value))
    return notAnArrayError();

  var itemConverter = ctx.typeRegistry.getConverter(this._itemType);
  var itemError;
  for (var ix in value) {
    itemError = itemConverter.validate(ctx, value[ix]);
    if (itemError) return itemError;
  }
};

function notAnArrayError() {
  return new Error(g.f('Value is not an array.'));
}
