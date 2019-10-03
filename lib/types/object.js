// Copyright IBM Corp. 2016,2017. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

const debug = require('debug')('strong-remoting:http-coercion');
const g = require('strong-globalize')();
const looksLikeJsonObject = require('../looks-like-json').looksLikeJsonObject;

module.exports = {
  fromTypedValue: function(ctx, value, options) {
    const error = this.validate(ctx, value, options);
    return error ? {error: error} : {value: value};
  },

  fromSloppyValue: function(ctx, value, options) {
    if (value === undefined || value === '') {
      // undefined was chosen so that it plays well with ES6 default parameters.
      return {value: undefined};
    }

    if (value === null || value === 'null')
      return {value: null};

    if (looksLikeJsonObject(value)) {
      try {
        const result = JSON.parse(value);
        debug('parsed %j as JSON: %j', value, result);
        return this.fromTypedValue(ctx, result, options);
      } catch (ex) {
        debug('Cannot parse object value %j. %s', value, ex);
        const err = new Error(g.f('Cannot parse JSON-encoded object value.'));
        err.statusCode = 400;
        return {error: err};
      }
    }

    // NOTE: nested values in objects are intentionally not coerced
    return this.fromTypedValue(ctx, value, options);
  },

  validate: function(ctx, value, options) {
    const self = this;
    options = options || {};
    if (value === undefined || value === null)
      return null;

    if (typeof value !== 'object')
      return errorNotAnObject();

    // reject object-like values that have their own strong-remoting type

    if (Array.isArray(value)) {
      // TODO: @davidcheung, remove this flag and support [array or Object]
      // see strong-remoting/issues/360 for details
      // allowArray flag is to handle persistedModels uses
      // array of Objects to batch create, which was supported in 2.x
      if (!options.allowArray) {
        return errorNotAnObject();
      } else {
        const hasInvalidItems = value.some(function(item) {
          // option is not passed here so it should always reject array `item(s)`
          return self.validate(ctx, item);
        });

        return hasInvalidItems ? errorArrayItemsNotAnObject() : null;
      }
    }

    if (value instanceof Date)
      return errorNotAnObject();

    return null;
  },
};

function errorNotAnObject() {
  const err = new Error(g.f('Value is not an object.'));
  err.statusCode = 400;
  return err;
}

function errorArrayItemsNotAnObject() {
  const err = new Error(g.f('Some of array items are not an object.'));
  err.statusCode = 400;
  return err;
}
