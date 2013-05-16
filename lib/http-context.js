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
  , assert = require('assert');
  
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
  // search these in order by name
  // req.params
  // req.body
  // req.query
  return this.req.param(name);
}

/**
 * Set an arg by name using the given options.
 *
 * @param {String} name
 * @param {Object} options **optional**
 */

HttpContext.prototype.setArgByName = function (name, options) {
  throw 'not implemented'
}

/**
 * Set part or all of the result by name using the given options.
 *
 * @param {String} name
 * @param {Object} options **optional**
 */

HttpContext.prototype.setResultByName = function (name, options) {

}

/**
 * Get part or all of the result by name using the given options.
 *
 * @param {String} name
 * @param {Object} options **optional**
 */

HttpContext.prototype.getResultByName = function (name, options) {

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
  method.invoke(scope, args, function (err) {
    if(err) {
      return fn(err);
    }
    
    var resultArgs = arguments;
    
    // map the arguments using the returns description
    if(returns.length > 1) {
      // multiple
      result = {};
      
      returns.forEach(function (o, i) {
        // map the name of the arg in the returns desc
        // to the same arg in the callback
        result[o.arg] = resultArgs[i + 1];
      });
    } else {
      // single or no result...
      result = resultArgs[1];
    }
    
    fn(null, result);
  });
}