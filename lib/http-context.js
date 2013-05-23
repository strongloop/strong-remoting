/**
 * Expose `HttpContext`.
 */

module.exports = HttpContext;

/**
 * Module dependencies.
 */
 
var EventEmitter = require('events').EventEmitter
  , debug = require('debug')('http-context')
  , util = require('util')
  , inherits = util.inherits
  , assert = require('assert')
  , SUPPORTED_TYPES = ['json'];
  
/**
 * Create a new `HttpContext` with the given `options`.
 *
 * @param {Object} options
 * @return {HttpContext}
 */

function HttpContext(req, res) {
  this.req = req;
  this.res = res;
}

/**
 * Inherit from `EventEmitter`.
 */

inherits(HttpContext, EventEmitter);

/**
 * Get an arg by name using the given options.
 *
 * @param {String} name
 * @param {Object} options **optional**
 */

HttpContext.prototype.getArgByName = function (name, options) {
  var req = this.req;
  var args = req.param('args');
  
  if(args) {
    args = JSON.parse(args);
  }
  
  if(typeof args !== 'object' || !args) {
    args = {};
  }
  
  var arg = (args && args[name]) || this.req.param(name);
  // search these in order by name
  // req.params
  // req.body
  // req.query
  return arg;
}

/**
 * Invoke the given shared method using the provided scope against the current context.
 */

HttpContext.prototype.invoke = function (scope, method, fn) {
  var args = {};
  var accepts = method.accepts;
  var returns = method.returns;
  var scope;
  var result;

  // build arguments from req and method options
  accepts.forEach(function (o) {
    if(o.http) {
      // the options have defined a formatter
      args[o.arg] = o.http(this);
    } else {
      args[o.arg] = this.getArgByName(o.arg, o);
    }
  }.bind(this));
  
  // invoke the shared method
  method.invoke(scope, args, fn);
}

/**
 * Finish the request and send the correct response.
 */

HttpContext.prototype.done = function () {
  // send the result back as
  // the requested content type
  var data = this.result;
  var res = this.res;
  var accepts = this.req.accepts(SUPPORTED_TYPES);
  var dataExists = typeof data !== 'undefined';
  
  if(dataExists) {
    switch(accepts) {
      case 'json':
        res.json(data);
      break;
      default:
        // not acceptable
        res.send(406);
      break;
    }
  } else {
    res.end();
  }
}