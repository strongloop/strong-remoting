// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

/**
 * Expose `Dynamic`.
 */

module.exports = Dynamic;

/**
 * Module dependencies.
 */

var g = require('strong-globalize')();
var debug = require('debug')('strong-remoting:dynamic');
var assert = require('assert');

/**
 * Create a dynamic value from the given value.
 *
 * @param {*} val The value object
 * @param {Context} ctx The Remote Context
 */

function Dynamic(val, ctx) {
  this.val = val;
  this.ctx = ctx;
}

/*!
 * Object containing converter functions.
 */

Dynamic.converters = {};

/**
 * Define a named type conversion. The conversion is used when a
 * `SharedMethod` argument defines a type with the given `name`.
 *
 * ```js
 * Dynamic.define('MyType', function(val, ctx) {
 *   // use the val and ctx objects to return the concrete value
 *   return new MyType(val);
 * });
 * ```
 *
 * @param {String} name The type name
 * @param {Function} converter
 */

Dynamic.define = function(name, converter) {
  converter.typeName = name;
  this.converters[name] = converter;
};

/**
 * Is the given type supported.
 *
 * @param {String} type
 * @returns {Boolean}
 */

Dynamic.canConvert = function(type) {
  return !!this.getConverter(type);
};

/**
 * Get converter by type name.
 *
 * If passed an array, will return an array, all coerced to the single
 * item in the array. More than one type in an array is not supported.
 *
 * @param {String|Array} type
 * @returns {Function}
 */
Dynamic.getConverter = function(type) {
  if (Array.isArray(type) && this.converters[type[0]]) {
    if (type.length !== 1) {
      throw new Error(g.f(
        'Coercing to an array type with more than 1 value is unsupported.'));
    }
    return this.getArrayConverter.bind(this, this.converters[type[0]]);
  }
  return this.converters[type];
};

/**
 * If the type passed is an array, get a converter that returns an array.
 * Type coercion will be one layer deep: ['a', 2, ['c', 4]] with type
 * ['string'] coerces to ['a', '2', '[c,4]'].
 * @param  {Function} converter Non-array converter fn.
 * @param  {*}        val       The value object
 * @param  {Context}  ctx       The Remote Context
 * @return {Function}           Converter
 */
Dynamic.getArrayConverter = function(converter, val, ctx) {
  if (!Array.isArray(val)) val = this.converters.array(val, ctx);
  return val.map(function(v) {
    return converter(v, ctx);
  });
};

/**
 * Convert the dynamic value to the given type.
 *
 * @param {String} type
 * @returns {*} The concrete value
 */

Dynamic.prototype.to = function(type) {
  var converter = this.constructor.getConverter(type);
  assert(converter, 'No Type converter defined for ' + type);
  return converter(this.val, this.ctx);
};

/**
 * Built in type converters...
 */

Dynamic.define('boolean', function convertToBoolean(val) {
  if (val == null) return val;
  if (val === '') return null;
  if (typeof val === 'string') {
    val = val.toLowerCase();
    return Boolean(val !== 'false' && val !== '0' && val !== 'null');
  }
  return Boolean(val);
});

Dynamic.define('number', function convertToNumber(val) {
  if (val == null) return val;
  if (val === '') return null;
  return Number(val);
});

Dynamic.define('integer', function convertToInteger(val) {
  if (val == null) return val;
  if (val === '') return null;
  // do not round the number, floats will be rejected by validation later
  return Dynamic.getConverter('number')(val);
});

Dynamic.define('string', function convertToString(val) {
  if (val == null) return val;
  if (typeof val === 'string') return val;
  if (typeof val.toString === 'function' &&
    val.toString !== Object.prototype.toString) return val.toString();
  if (val && typeof val === 'object') return JSON.stringify(val);
  throw new Error(g.f('Could not properly convert %s to a string', val));
});

Dynamic.define('date', function convertToDate(val) {
  if (val == null) return val;
  var result = new Date(val);
  if (Number.isNaN(result.getTime()))
    throw new Error(g.f('Invalid date value %j.', val));
  return result;
});

Dynamic.define('array', function convertToArray(val) {
  if (val == null || val === '') return [];
  if (Array.isArray(val)) return val;

  // This is not a sloppy conversion, so just wrap in array if it isn't already one.
  return [val];
});

// Defined so we can use a type like ['any']
Dynamic.define('any', function noop(val) {
  return val;
});
