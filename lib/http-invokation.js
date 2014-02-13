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
  var index = this.argIndex = {};
  this.args.forEach(function(val) {
    
  });
}

/**
 * Inherit from `EventEmitter`.
 */

inherits(HttpInvokation, EventEmitter);

/**
 * Build args object from the http context's `req` and `res`.
 */

HttpInvokation.prototype.createRequest = function () {
  var args = {};
  var accepts = method.accepts;
  var returns = method.returns;

  // build request args and method options
  accepts.forEach(function (o) {
    var httpFormat = o.http;
    var name = o.name || o.arg;
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
  

  return val;
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

HttpInvokation.prototype.invoke = function (scope, method, fn, isCtor) {
  var args = isCtor ? this.buildArgs(method) : this.args;
  var accepts = method.accepts;
  var returns = method.returns;
  var http = method.http;
  var pipe = http && http.pipe;
  var pipeDest = pipe && pipe.dest;
  var pipeSrc = pipe && pipe.source;

  if(pipeDest) {
    // only support response for now
    switch(pipeDest) {
      case 'res':
          // Probably not correct...but passes my test.
          this.res.header('Content-Type', 'application/json');
          this.res.header('Transfer-Encoding', 'chunked');

          var stream = method.invoke(scope, args, fn);
          stream.pipe(this.res);
        break;
      default:
          fn(new Error('unsupported pipe destination'));
        break;
    }
  } else if(pipeSrc) {
    // only support request for now
    switch(pipeDest) {
      case 'req':
          this.req.pipe(method.invoke(scope, args, fn));
        break;
      default:
          fn(new Error('unsupported pipe source'));
        break;
    }
  } else {
    // simple invoke
    method.invoke(scope, args, fn);
  }
}

/**
 * Finish the request and send the correct response.
 */

HttpInvokation.prototype.done = function () {
  // send the result back as
  // the requested content type
  var data = this.result;
  var res = this.res;
  res.header('X-Powered-By', 'LoopBack');
  var accepts = this.req.accepts(SUPPORTED_TYPES);
  var dataExists = typeof data !== 'undefined';

  if(dataExists) {
    switch(accepts) {
      case 'json':
      case 'application/javascript':
      case 'text/javascript':
        res.jsonp(data);
      break;
      default:
        // not acceptable
        res.send(406);
      break;
    }
  } else {
    res.header('Content-Type', 'application/json');
    res.statusCode = 204;
    res.end();
  }
}
