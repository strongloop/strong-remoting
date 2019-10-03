// Copyright IBM Corp. 2016,2017. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

const debug = require('debug')('strong-remoting:http-coercion');
const g = require('strong-globalize')();

module.exports = {
  fromTypedValue: function(ctx, value, options) {
    const error = this.validate(ctx, value, options);
    return error ? {error: error} : {value: value};
  },

  fromSloppyValue: function(ctx, value, options) {
    if (value === '') {
      // Pass on empty string as undefined.
      // undefined was chosen so that it plays well with ES6 default parameters.
      return {value: undefined};
    }

    // TODO(bajtos) should we reject objects/arrays values created from complex
    // query strings, e.g. ?arg[1]=a&arg[2]=b
    if (value !== undefined && value !== null)
      value = '' + value;

    return this.fromTypedValue(ctx, value, options);
  },

  validate: function(ctx, value, options) {
    if (value === undefined || typeof value === 'string')
      return null;

    const err = new Error(g.f('Value is not a string.'));
    err.statusCode = 400;
    return err;
  },
};
