// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var g = require('strong-globalize')();
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
var ContextBase = require('./context-base');
var SUPPORTED_TYPES = ['json', 'application/javascript', 'text/javascript'];
var qs = require('qs');
var urlUtil = require('url');
var ReadableStream = require('stream').Readable;
var MuxDemux = require('mux-demux');

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

function HttpInvocation(method, ctorArgs, args, baseUrl, auth, typeRegistry) {
  this.base = baseUrl;
  this.auth = auth;
  this.method = method;
  this.args = args || [];
  this.ctorArgs = ctorArgs || [];
  this.typeRegistry = typeRegistry;
  this.isStatic =
    (method.hasOwnProperty('isStatic') && method.isStatic) ||
    (method.hasOwnProperty('sharedMethod') && method.sharedMethod.isStatic);
  var namedArgs = this.namedArgs = {};
  var val;

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

  this.context = new ContextBase(method, typeRegistry);
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
          case 'formData':
            // From the form (body)
            req.body = req.body || {};
            req.body[name] = val;
            break;
          case 'query':
            // From the query string
            if (val !== undefined) {
              query = query || {};
              query[name] = serializeQueryStringValue(val, accept);
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
      query[name] = serializeQueryStringValue(val, accept);
    }
  } else {
    // default to storing args on the body for !GET
    req.body = req.body || {};
    req.body[name] = val;
  }

  return query;
};

function serializeQueryStringValue(val, accept) {
  if ((accept.type === 'object' || accept.type === 'string') &&
    typeof val === 'object') {
    return JSON.stringify(val);
  } else {
    return val;
  }
}

/**
 * Build args object from the http context's `req` and `res`.
 */

HttpInvocation.prototype.createRequest = function() {
  var method = this.method;
  var endpoint = method.getEndpoints()[0];
  var verb = endpoint.verb;
  var req = this.req = {method: verb || 'GET'};
  var accepts = method.accepts;
  var ctorAccepts = null;
  var query, i;
  var auth = this.auth;

  // initial url is the format
  req.url = this.base + endpoint.fullPath;

  var parsedUrl = urlUtil.parse(req.url);

  req.protocol = parsedUrl.protocol;

  // the body is json
  req.json = true;

  if (auth && auth.accessToken) {
    // use regular headers to send LoopBack's access token
    req.headers = req.headers || {};
    req.headers.Authorization = auth.accessToken.id;
  } else if (auth) {
    req.auth = {};
    // add auth if it is set
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
 * Get an argument value by name.
 *
 * @param {String} name
 * @returns {*} Value of specified argument.
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
  var method = this.method;
  var returnStreamDesc =
    method.sharedMethod.streams && method.sharedMethod.streams.returns;
  var methodReturnsStream = !!returnStreamDesc;

  if (methodReturnsStream) {
    if (returnStreamDesc.type === 'ReadableStream' && returnStreamDesc.json) {
      var mdm = new MuxDemux();
      mdm.on('connection', function(stream) {
        callback(null, stream);
      });

      request(this.req).pipe(mdm);
    } else {
      callback(new Error(g.f('unsupported stream type')));
    }

    return;
  }

  request(this.req, function(err, res, body) {
    if (err instanceof SyntaxError) {
      if (res.status === 204) err = null;
    }
    if (err) return callback(err);
    self.res = self.context.res = res;
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

  if (hasError) {
    if (isObject && body.error) {
      err = new Error(body.error.message);
      /* eslint-disable one-var */
      for (var key in body.error) {
        err[key] = body.error[key];
      }
      /* eslint-enable one-var */
    } else {
      err = new Error(g.f('Error: %d', res.statusCode));
      err.statusCode = res.statusCode;
      err.details = body;
    }

    return callback(err);
  }

  // build request args and method options
  for (var i = 0, n = returns.length; i < n; i++) {
    var ret = returns[i]; // eslint-disable-line one-var
    var name = ret.name || ret.arg; // eslint-disable-line one-var
    var val; // eslint-disable-line one-var

    var type = ret.type; // eslint-disable-line one-var

    if (ret.root) {
      val = res.body;
    } else {
      val = res.body[name];
    }

    var converter = this.typeRegistry.getConverter(type);
    var result = converter.fromTypedValue(this.context, val);
    debug('return arg %j: converted %j to %j', name, val, result);

    if (result.error) {
      err = result.error;
      err.message = g.f('Invalid return argument %j. ', name) + err.message;
      return callback(err);
    }

    callbackArgs.push(result.value);
    /* eslint-enable one-var */
  }

  callback.apply(this, callbackArgs);
};
