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
var ContextBase = require('./context-base');
var SharedMethod = require('./shared-method');

/**
 * Create a new `PrimusContext` with the given `options`.
 *
 * @param method
 * @param spark
 * @param ctorArgs
 * @param args
 * @param remotes
 * @constructor
 */

function PrimusContext(method, spark, ctorArgs, args, remotes) {
  ContextBase.call(this, method, remotes._typeRegistry);
  this.method = method;
  this.methodString = method.stringName;
  this.spark = spark;
  this.args = args;
  this.ctorArgs = ctorArgs;
  this.args = this.buildArgs(method);

  this.ctorArgs.options = {};
  this.args.options = {};
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

PrimusContext.prototype.buildArgs = function(method) {
  var args = {};
  var ctx = this;
  var accepts = method.accepts;

  // build arguments from req and method options
  for (var i = 0, n = accepts.length; i < n; i++) {
    var o = accepts[i];
    var httpFormat = o.http;
    var name = o.name || o.arg;
    var val;

    var typeConverter = ctx.typeRegistry.getConverter(o.type);
    var conversionOptions = SharedMethod.getConversionOptionsForArg(o);

    // Turn off sloppy coercion for values coming from JSON payloads.
    // This is because JSON, unlike other methods, properly retains types
    // like Numbers, Booleans, and null/undefined.
    var doSloppyCoerce = false;

    // This is an http method keyword, which requires special parsing.
    if (httpFormat) {
      switch (typeof httpFormat) {
        case 'function':
          // the options have defined a formatter
          val = httpFormat(ctx);
          // it's up to the custom provider to perform any coercion as needed
          doSloppyCoerce = false;
          break;
        case 'object':
          switch (httpFormat.source) {
            case 'context':
              // Direct access to http context
              val = ctx;
              break;
            default:
              // Otherwise take from payload
              val = ctx.getArgByName(name, o);
              break;
          }
          break;
      }
    } else {
      val = ctx.getArgByName(name, o);
    }

    // Most of the time, the data comes through 'sloppy' methods like HTTP headers or a qs
    // which don't preserve types.
    //
    // Use some sloppy typing semantics to try to guess what the user meant to send.
    var result = doSloppyCoerce ?
        typeConverter.fromSloppyValue(ctx, val, conversionOptions) :
        typeConverter.fromTypedValue(ctx, val, conversionOptions);

    debug('arg %j: %s converted %j to %j',
        name, doSloppyCoerce ? 'sloppy' : 'typed', val, result);

    var isValidResult = typeof result === 'object' &&
        ('error' in result || 'value' in result);
    if (!isValidResult)  {
      throw new (assert.AssertionError)({
        message: 'Type conversion result should have "error" or "value" property. ' +
        'Got ' + JSON.stringify(result) + ' instead.',
      });
    }

    if (result.error) {
      throw result.error;
    }

    // Set the argument value.
    args[o.arg] = result.value;
  }

  return args;
};
