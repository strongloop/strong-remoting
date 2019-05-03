// Copyright IBM Corp. 2016,2017. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var debug = require('debug')('strong-remoting:http-coercion');
var g = require('strong-globalize')();

module.exports = {
  fromTypedValue: function(ctx, value, options) {
    var error = this.validate(ctx, value, options);
    return error ? {error: error} : {value: value};
  },

  fromSloppyValue: function(ctx, value, options) {
    if (value === undefined || value === '')
      return {value: undefined};

    var result = +value;
    return this.fromTypedValue(ctx, result, options);
  },

  validate: function(ctx, value, options) {
    if (value === undefined)
      return null;

    if (typeof value === 'number' && !isNaN(value))
      return null;

    var err = Error(g.f('Value is not a number.'));
    err.statusCode = 400;
    return err;
  },
};
