/**
 * Expose `HttpInvokation`.
 */

module.exports = HttpInvokation;

/**
 * Module dependencies.
 */

var EventEmitter = require('events').EventEmitter
  , debug = require('debug')('strong-remoting:http-invokation')
  , util = require('util')
  , inherits = util.inherits
  , assert = require('assert')
  , SUPPORTED_TYPES = ['json', 'application/javascript', 'text/javascript'];

/**
 * Create a new `HttpInvokation`.
 */

function HttpInvokation(method, args) {
  this.method = method;
  this.args = args || [];
  var namedArgs = this.namedArgs = {};
  var val;
  var type;
  
  method.accepts.forEach(function(accept) {
    val = args.shift();
    if(HttpInvokation.isAcceptable(val, accept)) {
      namedArgs[accept.arg || accept.name] = val;
    }
  });
}

/**
 * Inherit from `EventEmitter`.
 */

inherits(HttpInvokation, EventEmitter);

/**
 * Determine if the value matches the given accept definition.
 */

HttpInvokation.isAcceptable = function(val, accept) {
  var type = accept.type && accept.type.toLowerCase();
  var strict = type || type !== 'any';
  
  if(strict) {
    return (typeof val).toLowerCase() === type; 
  } else {
    return true;
  }
}

/**
 * Build args object from the http context's `req` and `res`.
 */

HttpInvokation.prototype.createRequest = function () {
  var args = {};
  var accepts = method.accepts;
  var returns = method.returns;

  // build request args and method options
  accepts.forEach(function (accept) {
    var httpFormat = accept.http;
    var name = accept.name || accept.arg;
    var val = this.getArgByName(name);

    if(httpFormat) {
      switch(typeof httpFormat) {
        case 'function':
          // ignore defined formatter
        break;
        case 'object':
          switch(httpFormat.source) {
            case 'body':
               req.body = val;
            break;
            case 'form':
              // From the form (body)
              req.body = req.body || {};
              req.body[name] = val;
              break;
            case 'query':
              // From the query string
              req.query[name] = val;
              break;
            case 'path':
              // From the url path
              req.urlParams[name] = val;
            break;
          }
        break;
      }
    } else {
      // default to storing args on the body
      req.body = req.body || {};
      req.body[name] = val;
    }
  }.bind(this));

  return args;
}

/**
 * Get an arg value by name using the given options.
 *
 * @param {String} name
 */

HttpInvokation.prototype.getArgByName = function (name) {
  return this.namedArgs[name];
}

/**
 * Start the invokation.
 */

HttpInvokation.prototype.invoke = function (callback) {
  var req = this.createRequest();
  
  console.log(req);
  
  callback();
}
