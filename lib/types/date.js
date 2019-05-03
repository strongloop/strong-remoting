// Copyright IBM Corp. 2016,2017. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var debug = require('debug')('strong-remoting:http-coercion');
var g = require('strong-globalize')();

module.exports = {
  fromTypedValue: function(ctx, value, options) {
    if (value === undefined)
      return {value: value};

    if (value === null)
      return {error: invalidDateError()};

    if (typeof value !== 'number' && typeof value !== 'string')
      return {error: invalidDateError()};

    var result = new Date(value);
    var error = this.validate(result);
    return error ? {error: error} : {value: result};
  },

  fromSloppyValue: function(ctx, value, options) {
    if (value === '')
      return {value: undefined};

    if (/^-?[0-9]+$/.test(value)) {
      // convert a timestamp string to a number
      // that way ?from=0 produces 1970-01-01T00:00:00.000Z
      value = +value;
    }

    return this.fromTypedValue(ctx, value, options);
  },

  validate: function(ctx, value, options) {
    if (value === undefined)
      return null;

    if (value instanceof Date && !Number.isNaN(value.getTime()))
      return null;

    return invalidDateError();
  },
};

function invalidDateError() {
  var err = new Error(g.f('Value is not a valid date.'));
  err.statusCode = 400;
  return err;
}
