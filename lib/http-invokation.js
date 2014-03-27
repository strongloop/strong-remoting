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
  , path = require('path')
  , assert = require('assert')
  , request = require('request')
  , SUPPORTED_TYPES = ['json', 'application/javascript', 'text/javascript'];

/**
 * Create a new `HttpInvokation`.
 */

function HttpInvokation(method, args, base) {
  this.base = base;
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
  var strict = type && type !== 'any';
  
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
  var method = this.method;
  var req = {json: true, method: method.getHttpMethod() || 'GET'};
  var accepts = method.accepts;
  var returns = method.returns;

  // initial url is the format
  req.url = this.base + method.getFullPath();

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
              req.qs = req.qs || {};
              req.qs[name] = val;
              break;
            case 'path':
              // From the url path
              req.url = req.url.replace(':' + name, val);
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

  return req;
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
  request(req, function(err, res, body) {
    if(err) return callback(err);
    this.transformResponse(res, body, callback);
  }.bind(this));
}

/**
 * Transform the response into callback arguments
 * @param {HttpResponse} res
 * @param {Function} callback
 */

HttpInvokation.prototype.transformResponse = function(res, body, callback) {
  var callbackArgs = [null]; // null => placeholder for err
  var method = this.method;
  var returns = method.returns;
  var isObject = typeof body === 'object';
  var err;
  var hasError = res.statusCode >= 400;
  var errMsg;

  if(hasError) {
    if(isObject && body.error) {
      err = new Error(body.error.message);
      err.name = body.error.name;
      err.stack = body.error.stack;
      err.details = body.error.details;
    } else {
      err = new Error('Error: ' + res.statusCode);
    }

    return callback(err);
  }

  // build request args and method options
  returns.forEach(function (ret) {
    var httpFormat = ret.http;
    var name = ret.name || ret.arg;
    var val;

    if(ret.root) {
      val = res.body;
    } else {
      val = res.body[name];
    }

    callbackArgs.push(val);
  }.bind(this));

  callback.apply(this, callbackArgs);
}
