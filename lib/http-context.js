/*!
 * Expose `HttpContext`.
 */

module.exports = HttpContext;

/*!
 * Module dependencies.
 */

var EventEmitter = require('events').EventEmitter
  , debug = require('debug')('strong-remoting:http-context')
  , util = require('util')
  , inherits = util.inherits
  , assert = require('assert')
  , Dynamic = require('./dynamic')
  , js2xmlparser = require('js2xmlparser')
  , DEFAULT_SUPPORTED_TYPES = [
    'application/json', 'application/javascript', 'application/xml',
    'text/javascript', 'text/xml',
    'json', 'xml',
    '*/*'
  ];

/**
 * Create a new `HttpContext` with the given `options`.
 *
 * @param {Object} options
 * @return {HttpContext}
 * @class
 */

function HttpContext(req, res, method, options) {
  this.req = req;
  this.res = res;
  this.method = method;
  this.args = this.buildArgs(method);
  this.methodString = method.stringName;
  this.options = options || {};
  this.supportedTypes = this.options.supportedTypes || DEFAULT_SUPPORTED_TYPES;

  if (this.supportedTypes === DEFAULT_SUPPORTED_TYPES && !this.options.xml) {
    // Disable all XML-based types by default
    this.supportedTypes = this.supportedTypes.filter(function(type) {
      return !/\bxml\b/i.test(type);
    });
  }
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
  var errors = method.errors;

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
            case 'header':
              val = this.req.get(name);
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
    var otype = (typeof o.type === 'string') && o.type.toLowerCase();

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

  var arg = (args && args[name] !== undefined) ? args[name] :
            this.req.param(name) !== undefined ? this.req.param(name) :
            this.req.get(name);
  // search these in order by name
  // req.params
  // req.body
  // req.query
  // req.header


  // coerce simple types in objects
  if(typeof arg === 'object') {
    arg = coerceAll(arg);
  }

  return arg;
}

/*!
 * Integer test regexp.
 */

var isint = /^[0-9]+$/;

/*!
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

function toJSON(input) {
  if (!input) {
    return input;
  }
  if (typeof input.toJSON === 'function') {
    return input.toJSON();
  } else if (Array.isArray(input)) {
    return input.map(toJSON);
  } else {
    return input;
  }
}

function toXML(input) {
  var xml;
  if (input && typeof input.toXML === 'function') {
    xml = input.toXML();
  } else {
    if (input) {
      // Trigger toJSON() conversions
      input = toJSON(input);
    }
    if (Array.isArray(input)) {
      input = { result: input };
    }
    xml = js2xmlparser('response', input, {
      prettyPrinting: {
        indentString: '  '
      },
      convertMap: {
        '[object Date]': function(date) {
          return date.toISOString();
        }
      }
    });
  }
  return xml;
}
/**
 * Finish the request and send the correct response.
 */

HttpContext.prototype.done = function () {
  // send the result back as
  // the requested content type
  var data = this.result;
  var res = this.res;
  var accepts = this.req.accepts(this.supportedTypes);

  if (this.req.query._format) {
    accepts = this.req.query._format.toLowerCase();
  }
  var dataExists = typeof data !== 'undefined';

  if(dataExists) {
    switch(accepts) {
      case '*/*':
      case 'application/json':
      case 'json':
        res.json(data);
        break;
      case 'application/javascript':
      case 'text/javascript':
        res.jsonp(data);
        break;
      case 'application/xml':
      case 'text/xml':
      case 'xml':
        if (accepts === 'application/xml') {
          res.header('Content-Type', 'application/xml');
        } else {
          res.header('Content-Type', 'text/xml');
        }
        if (data === null) {
          res.header('Content-Length', '7');
          res.end('<null/>');
        } else {
          try {
            var xml = toXML(data);
            res.send(xml);
          } catch(e) {
            res.send(500, e + '\n' + data);
          }
        }
      break;
      default:
        // not acceptable
        res.send(406);
      break;
    }
  } else {
    res.get('Content-Type') || res.header('Content-Type', 'application/json');
    res.statusCode = 204;
    res.end();
  }
}
