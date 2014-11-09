'use strict';


/**
 * Expose `IOInvocation`.
 */
module.exports = IOInvocation;


/**
 * Module dependencies.
 */
var Dynamic = require('./dynamic');
var HttpInvocation = require('./http-invocation');


/**
 * Create a new `IOInvocation`.
 *
 * @constructor
 * @param {SharedMethod} method Shared method
 * @param {Array} ctorArgs Constructor arguments
 * @param {Array} args Method arguments
 * @param {Socket} client socket.io `Client` instance
 */
function IOInvocation(method, ctorArgs, args, client) {
  this.client = client;
  this.method = method;
  this.methodString = method.stringName;
  this.ctorArgs = ctorArgs;
  this.args = args;
  this.namedArgs = this.buildArgs();
};


/**
 * Build named arguments dictionary
 */
IOInvocation.prototype.buildArgs = function() {
  var ctorArgs = this.ctorArgs;
  var args = this.args;
  var method = this.method;
  var sharedCtor = method.sharedCtor;
  var namedArgs = {};
  var val;

  function setArgument(argArray) {
    return function(accept) {
      val = argArray.shift();
      if (HttpInvocation.isAcceptable(val, accept)) {
        namedArgs[accept.arg || accept.name] = val;
      }
    };
  }

  // first set args for constructor if prototype method
  if (!method.isStatic) {
    sharedCtor.accepts.forEach(setArgument(ctorArgs));
  }

  method.accepts.forEach(setArgument(args));

  return namedArgs;
};


/**
 * Invoke remote method
 *
 * @param {function(Error,...)} callback Callback function
 */
IOInvocation.prototype.invoke = function(callback) {
  var self = this;
  var methodString = this.methodString;
  var args = this.namedArgs;

  this.client.emit('invoke', methodString, args, done);

  function done(err, result) {
    if (err) {
      self.returnError(err, callback);
    }
    else {
      self.transformResult(result, callback);
    }
  }
};


/**
 * Create `Error` object
 *
 * @param {Object} error
 * @param {function(Error)} callback Callback function
 */
IOInvocation.prototype.returnError = function(error, callback) {
  var err;
  err = new Error(error.message);
  err.name = error.name;
  err.stack = error.stack;
  err.statusCode = err.status = error.status;
  err.details = error.details;
  callback(err);
};


/**
 * Transform response before returning it
 *
 * @param {*} result Invocation result
 * @param {function(Error,...)} callback Callback function
 */
IOInvocation.prototype.transformResult = function(result, callback) {
  var callbackArgs = [null];
  var method = this.method;
  var returns = method.returns;
  var namedArgs = this.namedArgs;
  var ctx = {
    socket: this.client,
    method: method,
    args: namedArgs,
    namedArgs: namedArgs
  }

  // build request args and method options
  returns.forEach(function(ret) {
    var name = ret.name || ret.arg;
    var val;
    var dynamic;
    var type = ret.type;

    if (ret.root) {
      val = result;
    }
    else {
      val = result[name];
    }

    if (Dynamic.canConvert(type)) {
      dynamic = new Dynamic(val, ctx);
      val = dynamic.to(type);
    }

    callbackArgs.push(val);
  }.bind(this));

  callback.apply(this, callbackArgs);
};
