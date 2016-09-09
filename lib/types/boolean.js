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
    if (value === '' || value === undefined)
      return { value: undefined };

    if (typeof value === 'string') {
      switch (value.toLowerCase()) {
        case 'false':
        case '0':
          return { value: false };
        case 'true':
        case '1':
          return { value: true };
      }
    }
    return { error: invalidBooleanError() };
  },

  validate: function(ctx, value) {
    if (value === undefined || typeof value === 'boolean')
      return null;

    return invalidBooleanError();
  },
};

function invalidBooleanError() {
  var err = new Error(g.f('Value is not a boolean.'));
  err.statusCode = 400;
  return err;
}
