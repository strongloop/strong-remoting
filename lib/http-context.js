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

function HttpContext(req, res, method) {
  this.req = req;
  this.res = res;
  this.method = method;
  this.args = this.buildArgs();
  this.methodString = method.stringName;
}

/**
 * Inherit from `EventEmitter`.
 */

inherits(HttpContext, EventEmitter);

/**
 * Build args object from the http context's `req` and `res`.
 */

HttpContext.prototype.buildArgs = function () {
  var args = {};
  var method = this.method;
  var accepts = method.accepts;
  var returns = method.returns;

  // build arguments from req and method options
  accepts.forEach(function (o) {
    var httpFormat = o.http;
    
    if(httpFormat) {
      switch(typeof httpFormat) {
        case 'function':
          // the options have defined a formatter
          args[o.arg] = httpFormat(this);  
        break;
        case 'object':
          switch(httpFormat.source) {
            case 'body':
              args[o.arg] = this.req.body;
            break;
            case 'url':
              args[o.arg] = this.req.params[o.arg];
            break;
            case 'req':
              args[o.arg] = this.req;
            break;
          }
        break;
      }
    } else {
      args[o.arg] = this.getArgByName(o.arg, o);
    }
  }.bind(this));
  
  return args;
}

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
  
  // coerce simple types
  return coerceAll(arg);
}

/**
 * Integer test regexp.
 */

var isint = /^[0-9]+$/;

/**
 * Float test regexp.
 */

var isfloat = /^([0-9]+)?\.[0-9]+$/;

function coerce(str) {
  if(typeof str != 'string') return str;
  if ('null' == str) return null;
  if ('true' == str) return true;
  if ('false' == str) return false;
  if (isfloat.test(str)) return parseFloat(str, 10);
  if (isint.test(str)) return parseInt(str, 10);
  return str;
}

// coerce every string in the given object / array
function coerceAll(obj) {
  var type = Array.isArray(obj) ? 'array' : typeof obj;
  
  switch(type) {
    case 'string':
        return coerce(obj);
    break;
    case 'object':
        Object.keys(obj).forEach(function (key) {
          obj[key] = coerceAll(obj[key]);
        });
    break;
    case 'array':
      obj.map(function (o) {
        return coerceAll(o);
      });
    break;
  }
  
  return obj;
}

/**
 * Invoke the given shared method using the provided scope against the current context.
 */

HttpContext.prototype.invoke = function (scope, method, fn) {
  var args = this.args;
  var accepts = method.accepts;
  var returns = method.returns;
  
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