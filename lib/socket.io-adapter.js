'use strict';

/*!
 * Expose `IOAdapter`.
 */
module.exports = IOAdapter;


/*!
 * Module dependencies.
 */
var assert = require('assert');
var debug = require('debug')('strong-remoting:socket.io-adapter');
var EventEmitter = require('events').EventEmitter;
var io = require('socket.io-client');
var sio = require('socket.io');
var util = require('util');
var IOContext = require('./socket.io-context');
var IOInvocation = require('./socket.io-invocation');
var inherits = util.inherits;
var slice = [].slice;


/**
 * Create a new `IOAdapter` with the given `options`.
 *
 * @constructor
 * @param {RemoteObjects} remotes
 * @param server
 */
function IOAdapter(remotes, server) {
  EventEmitter.apply(this, arguments);

  this.remotes = remotes;
  this.server = server;
  this.Context = IOContext;
}


/**
 * Inherit from `EventEmitter`.
 */
inherits(IOAdapter, EventEmitter);


/*!
 * Simplified APIs
 */
IOAdapter.create = IOAdapter.createIOAdapter =
  function createAdapter(remotes, server) {
    // add simplified construction / sugar here
    return new IOAdapter(remotes, server);
  };


IOAdapter.prototype.connect = function(url) {
  var options = this.getClientOptions();
  var namespacePath = this.getNamespacePath();

  url += namespacePath;

  // TODO(estliberitas) wait for connection? e.g. client.on('connect', ...)
  debug('Connecting to %s with options %j', url, options);

  this.connection = io.connect(url, options);
};


/**
 * Create handler for socket.io server
 *
 * @returns {} socket.io `Namespace` object
 */
IOAdapter.prototype.createHandler = function() {
  var self = this;
  var remotes = this.remotes;
  var server = this.server;
  var options = remotes.options.io || {};
  var ioServer = options.instance;
  var namespacePath = this.getNamespacePath();
  var nsp;

  // XXX(estliberitas) socket.io Server passed as `instance` in remotes options
  if (!(ioServer instanceof sio)) {
    options = options.server || {};

    debug('remoting options: %j', options);

    ioServer = sio(server, options);
  }

  nsp = ioServer.of(namespacePath);
  nsp.on('connection', handleConnection);

  function handleConnection(socket) {
    socket.on('invoke', self.invokeHandler(socket));
  }

  // return `Namespace` object so authentication middleware can be added later
  return nsp;
};


/**
 * Return socket.io `Client` options. Default: `/remotes`.
 *
 * @returns {Object}
 */
IOAdapter.prototype.getClientOptions = function() {
  var options = this.remotes.options.io || {};
  var clientOptions = options.client || {
      transports: ['websocket']
    };

  return clientOptions;
};


/**
 * Get socket.io `Namespace` path. Default: `/remotes`.
 *
 * @returns {String}
 */
IOAdapter.prototype.getNamespacePath = function() {
  var options = this.remotes.options.io || {};
  return options.namespace || '/remotes';
};


IOAdapter.prototype.invoke = function(method, ctorArgs, args, callback) {
  assert(this.connection, 'Cannot invoke method without a connection. See RemoteObjects#connect().');
  assert(typeof method === 'string', 'method is required when calling invoke()');

  var sharedMethod = this.remotes.findMethod(method);
  var argArray = slice.call(arguments, 1);
  var lastArg = argArray[argArray.length - 1];
  callback = (typeof lastArg === 'function') ? argArray.pop() : undefined;
  ctorArgs = (sharedMethod.isStatic) ? [] : argArray.shift();
  args = argArray.shift() || [];

  var invocation = new IOInvocation(sharedMethod, ctorArgs, args, this.connection);
  invocation.invoke(callback);
};


IOAdapter.prototype.invokeHandler = function(socket) {
  var self = this;
  var Context = this.Context;
  var remotes = this.remotes;

  return function methodInvokationHandler(methodString, args, callback) {
    var sharedMethod = remotes.findMethod(methodString);
    var ctx;

    if (!sharedMethod) {
      var message = 'There is no such method ' + methodString;
      var error = new Error(message);
      error.status = error.statusCode = 404;
      return callback(toErrorObject(error, methodString));
    }

    ctx = new Context(socket, args, sharedMethod);

    if (sharedMethod.isStatic) {
      self.invokeStaticMethod(ctx, sharedMethod, callback);
    }
    else {
      self.invokePrototypeMethod(ctx, sharedMethod, callback);
    }
  };
};


IOAdapter.prototype.invokeStaticMethod = function(ctx, sharedMethod, callback) {
  this.invokeMethod(ctx, sharedMethod, callback);
};


IOAdapter.prototype.invokePrototypeMethod = function(ctx, sharedMethod, callback) {
  var self = this;

  // invoke the shared constructor to get an instance
  ctx.invoke(sharedMethod.ctor, sharedMethod.sharedCtor, invokeMethod, true);

  function invokeMethod(err, inst) {
    if (err) {
      callback(toErrorObject(err, ctx.methodString));
    }
    else {
      ctx.instance = inst;
      self.invokeMethod(ctx, sharedMethod, callback);
    }
  }
};


IOAdapter.prototype.invokeMethod = function(ctx, method, callback) {
  this.remotes.invokeMethodInContext(ctx, method, sendResult);

  function sendResult(err) {
    if (err) {
      callback(toErrorObject(err, ctx.methodString));
    }
    else if (typeof ctx.result === 'undefined') {
      callback(null);
    }
    else {
      callback(null, ctx.result);
    }
  }
};


function toErrorObject(err, methodString) {
  if (typeof err === 'string') {
    err = new Error(err);
    err.status = err.statusCode = 500;
  }
  else {
    var statusCode = err.status || err.statusCode || 500;
    err.status = err.statusCode = statusCode;
  }

  debug('Error in %s: %s', methodString, err.stack);

  var data = {
    name: err.name,
    status: err.statusCode,
    message: err.message || 'An unknown error occurred'
  };

  for (var prop in err) {
    if (err.hasOwnProperty(prop)) {
      data[prop] = err[prop];
    }
  }

  // TODO(bajtos) Remove stack info when running in production
  data.stack = err.stack;

  return data;
}
