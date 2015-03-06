/*!
 * Expose `HttpInvocation`.
 */

module.exports = HttpInvocation;

/*!
 * Module dependencies.
 */

var EventEmitter = require('events').EventEmitter;
var debug = require('debug')('strong-remoting:http-invocation');
var util = require('util');
var inherits = util.inherits;
var path = require('path');
var assert = require('assert');
var request = require('request');
var Dynamic = require('./dynamic');
var SUPPORTED_TYPES = ['json', 'application/javascript', 'text/javascript'];
var qs = require('qs');
var urlUtil = require('url');

/*!
 * JSON Types
 */

var JSON_TYPES = ['boolean', 'string', 'object', 'number'];

/**
 * Create a new `HttpInvocation`.
 * @class
 * @param {SharedMethod} method
 * @param {Array} [args]
 * @param {String} base The base URL
 * @property {String} base The base URL
 * @property {SharedMethod} method The `SharedMethod` which will be invoked
 * @property {Array} args The arguments to be used when invoking the `SharedMethod`
 */

function HttpInvocation(method, ctorArgs, args, base, auth) {
  this.base = base;
  this.auth = auth;
  this.method = method;
  this.args = args || [];
  this.ctorArgs = ctorArgs || [];
  this.isStatic =
    (method.hasOwnProperty('isStatic') && method.isStatic) ||
    (method.hasOwnProperty('sharedMethod') && method.sharedMethod.isStatic);
  var namedArgs = this.namedArgs = {};
  var val;
  var type;

  if (!this.isStatic) {
    method.restClass.ctor.accepts.forEach(function(accept) {
      val = ctorArgs.shift();
      if (HttpInvocation.isAcceptable(val, accept)) {
        namedArgs[accept.arg || accept.name] = val;
      }
    });
  }

  method.accepts.forEach(function(accept) {
    val = args.shift();
    if (HttpInvocation.isAcceptable(val, accept)) {
      namedArgs[accept.arg || accept.name] = val;
    }
  });
}

/**
 * Inherit from `EventEmitter`.
 */

inherits(HttpInvocation, EventEmitter);

/**
 * Determine if the value matches the given accept definition.
 */

HttpInvocation.isAcceptable = function(val, accept) {
  var acceptArray = Array.isArray(accept.type) || accept.type.toLowerCase() === 'array';
  var type = acceptArray ? 'array' : accept.type && accept.type.toLowerCase();
  var strict = type && type !== 'any';

  if (acceptArray) {
    return Array.isArray(val);
  }

  if (strict) {
    if (JSON_TYPES.indexOf(type) === -1) {
      return typeof val === 'object';
    }
    return (typeof val).toLowerCase() === type;
  } else {
    return true;
  }
};

HttpInvocation.prototype._processArg = function(req, verb, query, accept) {
  var httpFormat = accept.http;
  var name = accept.name || accept.arg;
  var val = this.getArgByName(name);

  if (httpFormat) {
    switch (typeof httpFormat) {
      case 'function':
        // ignore defined formatter
        break;
      case 'object':
        switch (httpFormat.source) {
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
            if (val !== undefined) {
              query = query || {};
              query[name] = val;
            }
            break;
          case 'header':
            if (val !== undefined) {
              req.headers = req.headers || {};
              req.headers[name] = val;
            }
            break;
          case 'path':
            // From the url path
            req.url = req.url.replace(':' + name, val);
            break;
        }
        break;
    }
  } else if (verb.toLowerCase() === 'get') {
    // default to query string for GET
    if (val !== undefined) {
      query = query || {};
      query[name] = val;
    }
  } else {
    // default to storing args on the body for !GET
    req.body = req.body || {};
    req.body[name] = val;
  }

  return query;
};

/**
 * Build args object from the http context's `req` and `res`.
 */

HttpInvocation.prototype.createRequest = function() {
  var method = this.method;
  var verb = method.getHttpMethod();
  var req = this.req = {json: true, method: verb || 'GET'};
  var accepts = method.accepts;
  var ctorAccepts = null;
  var query;
  var i;
  var auth = this.auth;

  // initial url is the format
  req.url = this.base + method.getFullPath();

  // add auth if it is set
  if (auth) {
    req.auth = {};
    if (auth.username && auth.password) {
      req.auth.username = auth.username;
      req.auth.password = auth.password;
    }
    if (auth.bearer) {
      req.auth.bearer = auth.bearer;
    }
    if ('sendImmediately' in auth) {
      req.auth.sendImmediately = auth.sendImmediately;
    } else {
      req.auth.sendImmediately = false;
    }
  }

  // build request args and method options
  if (!this.isStatic) {
    ctorAccepts = method.restClass.ctor.accepts;
    for (i in ctorAccepts) {
      query = this._processArg(req, verb, query, ctorAccepts[i]);
    }
  }

  for (i in accepts) {
    query = this._processArg(req, verb, query, accepts[i]);
  }

  if (query) {
    req.url += '?' + qs.stringify(query);
  }

  return req;
};

/**
 * Get an arg value by name using the given options.
 *
 * @param {String} name
 */

HttpInvocation.prototype.getArgByName = function(name) {
  return this.namedArgs[name];
};

/**
 * Start the invocation.
 */

HttpInvocation.prototype.invoke = function(callback) {
  var self = this;
  if (!this.req) {
    this.createRequest();
  }
  request(this.req, function(err, res, body) {
    if (err instanceof SyntaxError) {
      if (res.status === 204) err = null;
    }
    if (err) return callback(err);
    self.res = res;
    self.transformResponse(res, body, callback);
  });
};

/*
 * Get Response object
 */

HttpInvocation.prototype.getResponse = function() {
  return this.res || null;
};

/**
 * Transform the response into callback arguments
 * @param {HttpResponse} res
 * @param {Function} callback
 */

HttpInvocation.prototype.transformResponse = function(res, body, callback) {
  var self = this;
  var callbackArgs = [null]; // null => placeholder for err
  var method = this.method;
  var returns = method.returns;
  var isObject = typeof body === 'object';
  var err;
  var hasError = res.statusCode >= 400;
  var ctx = {
    method: method,
    req: res.req,
    res: res
  };

  if (hasError) {
    if (isObject && body.error) {
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
  for (var i = 0, n = returns.length; i < n; i++) {
    var ret = returns[i];
    var name = ret.name || ret.arg;
    var val;
    var dynamic;
    var type = ret.type;

    if (ret.root) {
      val = res.body;
    } else {
      val = res.body[name];
    }

    if (typeof type === 'string' && Dynamic.canConvert(type)) {
      dynamic = new Dynamic(val, ctx);
      val = dynamic.to(type);
    } else if (Array.isArray(type) && Dynamic.canConvert(type[0])) {
      type = type[0];
      for (var j = 0, k = val.length; j < k; j++) {
        var _val = val[j];
        dynamic = new Dynamic(_val, ctx);
        val[j] = dynamic.to(type);
      }
    }

    callbackArgs.push(val);
  }

  callback.apply(this, callbackArgs);
};
