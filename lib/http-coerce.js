// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var debug = require('debug')('strong-remoting:http-coercion');
var escapeRegex = require('escape-string-regexp');

module.exports = httpCoerce;

/**
 * Do a sloppy string coercion into a target type.
 * Useful for params sent via HTTP params, querystring, headers, or non-JSON body.
 *
 * @param {*} val  Value to coerce. Only works on strings, just returns non-string values.
 * @param {string|Array<String>} targetType Type to coerce to.
 * @param {Context} ctx HTTP Context.
 */

function httpCoerce(val, targetType, ctx) {
  var result;

  if (val === undefined || val === '') {
    // Pass on undefined/empty string as undefined.
    // undefined was chosen so that it plays well with ES6 default parameters.
    result = undefined;
  } else if (targetType === 'boolean') {
    result = coerceToBoolean(val);
  } else if (targetType === 'number' || targetType === 'integer') {
    result = coerceToNumber(val);
  } else if (targetType === 'string') {
    result = '' + val;
  } else {
    // TODO - handle "date" type
    result = coerceComplexOrUnknownType(val, targetType, ctx);
  }

  debug('coerced %j to %j (type %j)', val, result, targetType);
  return result;
}

/*!
 * Integer test regexp. Doesn't match if number has a leading zero.
 */

var isInt = /^\-?(?:[0-9]|[1-9][0-9]*)$/;

/*!
 * Float test regexp.
 */

var isFloat = /^\-?([0-9]+)?\.[0-9]+$/;
var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || Math.pow(2, 53) - 1;
var MIN_SAFE_INTEGER = Number.MIN_SAFE_INTEGER || -MAX_SAFE_INTEGER;

function coerceString(val) {
  if (typeof val !== 'string') return val;
  if (RESERVED_VALUES.hasOwnProperty(val)) return RESERVED_VALUES[val];
  if (isFloat.test(val) || isInt.test(val)) {
    var out = Number(val);
    // Cap at MAX_SAFE_INTEGER so we don't lose precision.
    if (out > MAX_SAFE_INTEGER || out < MIN_SAFE_INTEGER) out = val;
    return out;
  }
  // Nothing matched; return string.
  return val;
}

function coerceToBoolean(val) {
  switch (typeof val) {
    case 'string':
      switch (val) {
        case 'false':
        case 'undefined':
        case 'null':
        case '0':
          return false;
        default:
          return true;
      }
      break;
    case 'number':
      return val !== 0;
    default:
      return Boolean(val);
  }
}

// Number() constructor usually does the right thing, but on really malformed input
// it actually returns 0. We don't want that, so we check if parseFloat()
// returned NaN first. Stricter is better here, we don't want to convert weird
// things like '1x' to 1, but '1e8' > 100000000 is okay.
function coerceToNumber(val) {
  if (isNaN(parseFloat(val))) return NaN;
  return Number(val);
}

function coerceArray(val, targetType, ctx) {
  if (typeof val === 'string' && val[0] === '[') {
    // If it looks like a JSON array, try to parse it.
    // No coercion is applied in such case.
    if (val[0] === '[') {
      try {
        return JSON.parse(val);
      } catch (ex) { /* Do nothing */ }
    }
  }

  // The user may set delimiters like ',', or ';' to designate array items
  // for easier usage.
  var delims = ctx.options && ctx.options.arrayItemDelimiters;

  var result;
  if (Array.isArray(val)) {
    result = val;
  } else if (delims) {
    // Construct delimiter regex if input was an array. Overwrite option
    // so this only needs to happen once.
    if (Array.isArray(delims)) {
      delims = new RegExp(delims.map(escapeRegex).join('|'), 'g');
      ctx.options.arrayItemDelimiters = delims;
    }
    result = val.split(delims);
  } else {
    // Alright, not array-like, just wrap it in an array on the way out.
    result = [val];
  }

  debug('intermediate array result %j', result);

  // Members may need to be coerced as well.
  result = result.map(function(v) {
    return httpCoerce(v, targetType[0], ctx);
  });

  return result;
}

function coerceComplexOrUnknownType(val, targetType, ctx) {
  // Support null/"null" only for complex types (typeof result === 'object')
  if (val === 'null' || val === null)
    return null;

  // If an array type if defined, regardless of what type it is, try to coerce the string
  // into an array.
  if (Array.isArray(targetType)) {
    if (targetType[0] === 'string') {
      switch (val) {
        // prevent coercion into [null]
        case '[null]': return ['null'];
      }
    }
    return coerceArray(val, targetType, ctx);
  }

  if (targetType === 'any' && typeof val !== 'object') {
    // If the targetType specified is 'any', do sloppy string conversion.
    val = coerceString(val);
  }

  // NOTE: nested values in objects are intentionally not coerced

  return val;
}

// Map of some values to convert directly to primitives.
var RESERVED_VALUES = {
  'false': false,
  'true': true,
  'null': null
};
