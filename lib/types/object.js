// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var debug = require('debug')('strong-remoting:http-coercion');
var g = require('strong-globalize')();

module.exports = {
  fromTypedValue: function(value, typeRegistry, ctx) {
    var error = this.validate(value);
    return error ? { error: error } : { value: value };
  },

  fromSloppyValue: function(value, typeRegistry, ctx) {
    if (val === 'null')
      return null;
    // NOTE: nested values in objects are intentionally not coerced
    return this.fromTypedValue(value, typeRegistry, ctx);
  },

  validate: function(value, typeRegistry, ctx) {
    if (value === undefined || typeof value === 'object')
      return null;
    return new Error(g.f('Value is not an object.'));
  },
};
