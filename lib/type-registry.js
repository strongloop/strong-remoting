// Copyright IBM Corp. 2016,2017. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var ArrayConverter = require('./types/array');
var assert = require('assert');
var debug = require('debug')('strong-remoting:types');
var g = require('strong-globalize')();

module.exports = TypeRegistry;

function TypeRegistry(options) {
  this._options = options || {};
  this._types = Object.create(null);
  this._registerBuiltinTypes();
}

TypeRegistry.prototype.registerType = function(typeName, converter) {
  assert(typeof typeName === 'string' && typeName,
    'typeName must be a non-empty string');
  assert(typeof converter === 'object' && converter,
    'converter must be an object');
  assert(typeof converter.fromTypedValue === 'function',
    'converter.fromTypedValue must be a function');
  assert(typeof converter.fromSloppyValue === 'function',
    'converter.fromSloppyValue must be a function');
  assert(typeof converter.validate === 'function',
    'converter.validate must be a function');

  typeName = typeName.toLowerCase();

  if (typeName === 'file') {
    throw new Error(g.f('Cannot override built-in "{{file}}" type.'));
  }

  if (typeName in this._types) {
    if (this._options.warnWhenOverridingType !== false)
      g.warn('Warning: overriding remoting type %s', typeName);
    else
      debug('Warning: overriding remoting type %s', typeName);
  }

  this._types[typeName] = converter;
};

TypeRegistry.prototype.registerObjectType = function(typeName, factoryFn) {
  assert(typeof typeName === 'string' && typeName,
    'typeName must be a non-empty string');
  assert(typeof factoryFn === 'function', 'factoryFn must be a function');

  var converter = {
    fromTypedValue: function(ctx, data, options) {
      var objectConverter = ctx.typeRegistry.getConverter('object');
      var result = objectConverter.fromTypedValue(ctx, data, options);
      if (result.error || result.value === undefined || result.value === null)
        return result;

      try {
        return {value: factoryFn(result.value)};
      } catch (err) {
        return {error: err};
      }
    },

    fromSloppyValue: function(ctx, value, options) {
      var objectConverter = ctx.typeRegistry.getConverter('object');
      var result = objectConverter.fromSloppyValue(ctx, value, options);
      return result.error ? result : this.fromTypedValue(ctx, result.value);
    },

    validate: function(ctx, value, options) {
      return ctx.typeRegistry.getConverter('object').validate(ctx, value, options);
    },
  };

  this.registerType(typeName, converter);
};

TypeRegistry.prototype.getConverter = function(type) {
  assert(typeof type === 'string' || Array.isArray(type),
    'type must be either an array or a string.');

  if (type === 'array')
    type = ['any'];

  if (Array.isArray(type)) {
    if (type.length !== 1) {
      g.warn('Array types with more than one item type are not supported. ' +
        'Using the first item type and ignoring the rest.');
    }

    return new ArrayConverter(type[0] || 'any');
  }

  type = type.toLowerCase();

  // TODO fall-back to Dynamic converters
  return this._types[type] || this._getUnknownTypeConverter(type);
};

TypeRegistry.prototype._registerBuiltinTypes = function() {
  // NOTE we have to explicitly enumerate all scripts to support browserify
  this.registerType('any', require('./types/any'));
  this.registerType('boolean', require('./types/boolean'));
  this.registerType('date', require('./types/date'));
  this.registerType('integer', require('./types/integer'));
  this.registerType('number', require('./types/number'));
  this.registerType('object', require('./types/object'));
  this.registerType('string', require('./types/string'));
  this.registerType('geopoint', require('./types/geopoint'));
};

TypeRegistry.prototype._getUnknownTypeConverter = function(type) {
  if (this._options.warnOnUnknownType !== false)
    g.warn('Treating unknown remoting type %j as "any"', type);
  else
    debug('Treating unknown remoting type %j as "any"', type);

  return this.getConverter('any');
};
