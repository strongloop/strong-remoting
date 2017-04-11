// Copyright IBM Corp. 2013,2014. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var g = require('strong-globalize')();
/**
 * Expose `PrimusContext`.
 */
module.exports = PrimusContext;

/**
 * Module dependencies.
 */

var EventEmitter = require('events').EventEmitter;
var debug = require('debug')('strong-remoting:primus-context');
var util = require('util');
var inherits = util.inherits;
var assert = require('assert');

/**
 * Create a new `PrimusContext` with the given `options`.
 *
 * @param {Object} options
 * @return {PrimusContext}
 */

function PrimusContext(spark, ctorArgs, args, remotes) {
  this.spark = spark;
  this.ctorArgs = ctorArgs;
  this.args = args;
  this.typeRegistry = remotes._typeRegistry;
}

/**
 * Inherit from `EventEmitter`.
 */

inherits(PrimusContext, EventEmitter);

/**
 * Get an arg by name using the given options.
 *
 * @param {String} name
 * @param {Object} options **optional**
 */

PrimusContext.prototype.getArgByName = function(name, options) {
  return this.args[name];
};

/**
 * Set an arg by name using the given options.
 *
 * @param {String} name
 * @param {Object} options **optional**
 */

PrimusContext.prototype.setArgByName = function(name, options) {
  throw 'not implemented';
};

/**
 * Set part or all of the result by name using the given options.
 *
 * @param {String} name
 * @param {Object} options **optional**
 */

PrimusContext.prototype.setResultByName = function(name, options) {

};

/**
 * Get part or all of the result by name using the given options.
 *
 * @param {String} name
 * @param {Object} options **optional**
 */

PrimusContext.prototype.getResultByName = function(name, options) {

};

/**
 * Invoke the given shared method using the provided scope against
 * the current context.
 */

PrimusContext.prototype.invoke = function(scope, method, fn) {
  var args = method.isSharedCtor ? this.ctorArgs : this.args;
  var accepts = method.accepts;
  var returns = method.returns;
  var errors = method.errors;
  var result;

  // invoke the shared method

  method.invoke(scope, args || {}, null, this, function(err) {
    var resultArgs = arguments;

    if (method.name === 'on' && method.ctor instanceof EventEmitter) {
      resultArgs[1] = resultArgs[0];
      err = null;
    }

    if (err) {
      return fn(err);
    }

    // map the arguments using the returns description
    if (returns.length > 1) {
      // multiple
      result = {};

      returns.forEach(function(o, i) {
        // map the name of the arg in the returns desc
        // to the same arg in the callback
        result[o.name || o.arg] = resultArgs[i + 1];
      });
    } else {
      // single or no result...
      result = resultArgs[1];
    }

    fn(null, result);
  });
};

PrimusContext.prototype.setReturnArgByName = function(name, value) {

};
