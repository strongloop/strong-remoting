/**
 * Expose `HttpContext`.
 */

module.exports = HttpContext;

/**
 * Module dependencies.
 */

var EventEmitter = require('events').EventEmitter
  , debug = require('debug')('strong-remoting:http-context')
  , util = require('util')
  , inherits = util.inherits
  , assert = require('assert')
  , Dynamic = require('./dynamic')
  , SUPPORTED_TYPES = ['json', 'application/javascript', 'text/javascript'];

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
  this.args = this.buildArgs(method);
  this.methodString = method.stringName;
}

/**
 * Inherit from `EventEmitter`.
 */

inherits(HttpContext, EventEmitter);

/**
 * Build args object from the http context's `req` and `res`.
 */

HttpContext.prototype.buildArgs = function (method) {
  var args = {};
  var ctx = this;
  var accepts = method.accepts;
  var returns = method.returns;

  // build arguments from req and method options
  accepts.forEach(function (o) {
    var httpFormat = o.http;
    var name = o.name || o.arg;
    var val;

    if(httpFormat) {
      switch(typeof httpFormat) {
        case 'function':
          // the options have defined a formatter
          val = httpFormat(this);
        break;
        case 'object':
          switch(httpFormat.source) {
            case 'body':
              val = this.req.body;
            break;
            case 'form':
              // From the form (body)
              val = this.req.body && this.req.body[name];
              break;
            case 'query':
              // From the query string
              val = this.req.query[name];
              break;
            case 'path':
              // From the url path
              val = this.req.params[name];
            break;
            case 'req':
              // Direct access to http req
              val = this.req;
            break;
            case 'res':
              // Direct access to http res
              val = this.res;
              break;
            case 'context':
              // Direct access to http context
              val = this;
              break;
          }
        break;
      }
    } else {
      val = this.getArgByName(name, o);
    }

    // cast booleans and numbers
    var dynamic;
    var type = typeof val;
    var otype = o.type && o.type.toLowerCase();

    if(Dynamic.canConvert(otype)) {
      dynamic = new Dynamic(val, ctx);
      val = dynamic.to(otype);
    }

    // set the argument value
    args[o.arg] = val;
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


  // coerce simple types in objects
  if(typeof arg === 'object') {
    arg = coerceAll(arg);
  }

  return arg;
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
        if(obj) {
          Object.keys(obj).forEach(function (key) {
            obj[key] = coerceAll(obj[key]);
          });
        }  
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

HttpContext.prototype.invoke = function (scope, method, fn, isCtor) {
  var args = this.args;
  if(isCtor) {
    try {
      args = this.buildArgs(method);
    } catch(err) {
      // JSON.parse() might throw
      return fn(err);
    }
  }
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
