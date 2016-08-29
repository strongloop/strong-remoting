// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var debug = require('debug')('strong-remoting:http-coercion');
var g = require('strong-globalize')();

module.exports = {
  fromTypedValue: function(ctx, value) {
    var error = this.validate(ctx, value);
    return error ? { error: error } : { value: value };
  },

  fromSloppyValue: function(ctx, value) {
    if (value === '') {
      // Pass on empty string as undefined.
      // undefined was chosen so that it plays well with ES6 default parameters.
      return { value: undefined };
    }

    // TODO(bajtos) should we reject objects/arrays values created from complex
    // query strings, e.g. ?arg[1]=a&arg[2]=b
    if (value !== undefined && value !== null)
      value = '' + value;

    return this.fromTypedValue(ctx, value);
  },

  validate: function(ctx, value) {
    if (value === undefined || typeof value === 'string')
      return null;

    var err = new Error(g.f('Value is not a string.'));
    err.statusCode = 400;
    return err;
  },
};
