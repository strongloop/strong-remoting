'use strict';

/**
 * Expose `IOContext`.
 */
module.exports = IOContext;


/**
 * Module dependencies.
 */
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var inherits = util.inherits;
var assert = require('assert');


/**
 * Create a new `IOContext` with the given `options`.
 *
 * @param {Socket} socket socket.io `Socket` object
 * @param args Method arguments
 * @param {SharedMethod} method
 */
function IOContext(socket, args, method) {
  this.socket = socket;
  this.args = args;
  this.method = method;
  this.namedArgs = this.buildArgs(method);
  this.methodString = method.stringName;
}


/**
 * Inherit from `EventEmitter`.
 */
inherits(IOContext, EventEmitter);


/**
 * Build args object from provided arguments
 *
 * @param {SharedMethod} method
 */
IOContext.prototype.buildArgs = function(method) {
  var args = {};
  var accepts = method.accepts;

  // build arguments from req and method options
  accepts.forEach(function setArgument(o) {
    var name = o.name || o.arg;

    // TODO(estliberitas) add support for query string params here?

    args[o.arg] = this.getArgByName(name, o);
  }.bind(this));

  return args;
};


/**
 * Get argument by name
 *
 * @param {String} name
 */
IOContext.prototype.getArgByName = function(name) {
  return this.args[name];
};


/**
 * Invoke the given shared method using the provided scope against the current
 * context.
 *
 * @param scope
 * @param {SharedMethod} method Called method
 * @param {function(Error,...)} callback Callback function
 * @param {boolean=false} isCtor If invoking constructor
 */
IOContext.prototype.invoke = function(scope, method, callback, isCtor) {
  var args;

  if (isCtor) {
    args = this.buildArgs(method);
  }
  else {
    args = this.namedArgs;
  }

  method.invoke(scope, args, callback);
};
