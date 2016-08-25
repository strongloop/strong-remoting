// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

module.exports = TypeRegistry;

var g = require('strong-globalize')();

function TypeRegistry() {
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
  assert(typeof converter.fromSloppyString === 'function',
    'converter.fromSloppyString must be a function');
  assert(typeof converter.validate === 'function',
    'converter.validate must be a function');

  if (typeName in this._types) {
    g.warn('Warning: overriding remoting type %s', typeName);
  }

  this._types[typeName] = converter;
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

  // TODO fall-back to Dynamic converters
  return this._types[type] || unknownTypeConverter(type);
};

TypeRegistry.prototype._registerBuiltinTypes = function() {
  // NOTE we have to explicitly enumerate all scripts to support browserify
  this.register(require('./types/any'));
  this.register(require('./types/boolean'));
  this.register(require('./types/date'));
  this.register(require('./types/integer'));
  this.register(require('./types/number'));
  this.register(require('./types/object'));
  this.register(require('./types/string'));
};


function unknownTypeConverter = function(type) {
  g.warn('No conversion will be applied for unknown remoting type %j', type);

  return {
    fromTypedValue: function(value) {
      return { result: value };
    },

    fromSloppyString: function(value) {
      return { result: value };
    },

    validate: function() {
      // no-op, all values are valid
    }
  };
};
