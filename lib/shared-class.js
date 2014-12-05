/**
 * Expose `SharedClass`.
 */

module.exports = SharedClass;

/**
 * Module dependencies.
 */

var debug = require('debug')('strong-remoting:shared-class');
var util = require('util');
var inherits = util.inherits;
var inflection = require('inflection');
var SharedMethod = require('./shared-method');
var assert = require('assert');

/**
 * Create a new `SharedClass` with the given `options`.
 *
 * @class SharedClass
 * @param {String} name The `SharedClass` name
 * @param {Function} constructor The `constructor` the `SharedClass` represents
 * @param {Object} options Additional options.
 * @property {Function} ctor The `constructor`
 * @property {Object} http The HTTP settings
 * @return {SharedClass}
 */

function SharedClass(name, ctor, options) {
  options = options || {};
  this.name = name || ctor.remoteNamespace;
  this.ctor = ctor;
  this._methods = [];
  this._resolvers = [];
  this._disabledMethods = {};
  var http = ctor && ctor.http;
  var normalize = options.normalizeHttpPath;

  var defaultHttp = {};
  defaultHttp.path = '/' + this.name;

  if (Array.isArray(http)) {
    // use array as is
    this.http = http;
    if (http.length === 0) {
      http.push(defaultHttp);
    }
    if (normalize) {
      this.http.forEach(function(h) {
        h.path = SharedClass.normalizeHttpPath(h.path);
      });
    }
  } else {
    // set http.path using the name unless it is defined
    // TODO(ritch) move http normalization from adapter.getRoutes() to a
    // better place... eg SharedMethod#getRoutes() or RestClass
    this.http = util._extend(defaultHttp, http);
    if (normalize) this.http.path = SharedClass.normalizeHttpPath(this.http.path);
  }

  if (typeof ctor === 'function' && ctor.sharedCtor) {
    // TODO(schoon) - Can we fall back to using the ctor as a method directly?
    // Without that, all remote methods have to be two levels deep, e.g.
    // `/meta/routes`.

    this.sharedCtor = new SharedMethod(ctor.sharedCtor, 'sharedCtor', this);
  }
  assert(this.name, 'must include a remoteNamespace when creating a SharedClass');
}

/**
 * Normalize http path.
 */

SharedClass.normalizeHttpPath = function(path) {
  if (typeof path !== 'string') return;
  return path.replace(/[^\/]+/g, function(match) {
    if (match.indexOf(':') > -1) return match; // skip placeholders
    return inflection.transform(match, ['underscore', 'dasherize']);
  });
};

/**
 * Get all shared methods belonging to this shared class.
 *
 * @returns {SharedMethod[]} An array of shared methods
 */

SharedClass.prototype.methods = function() {
  var ctor = this.ctor;
  var methods = [];
  var sc = this;
  var functionIndex = [];

  // static methods
  eachRemoteFunctionInObject(ctor, function(fn, name) {
    if (functionIndex.indexOf(fn) === -1) {
      functionIndex.push(fn);
    } else {
      var sharedMethod = find(methods, fn);
      sharedMethod.addAlias(name);
      return;
    }
    methods.push(SharedMethod.fromFunction(fn, name, sc, true));
  });

  // instance methods
  eachRemoteFunctionInObject(ctor.prototype, function(fn, name) {
    if (functionIndex.indexOf(fn) === -1) {
      functionIndex.push(fn);
    } else {
      var sharedMethod = find(methods, fn);
      sharedMethod.addAlias(name);
      return;
    }
    methods.push(SharedMethod.fromFunction(fn, name, sc));
  });

  // resolvers
  this._resolvers.forEach(function(resolver) {
    resolver.call(this, _define.bind(sc, methods));
  });

  methods = methods.concat(this._methods);

  return methods.filter(sc.isMethodEnabled.bind(sc));
};

SharedClass.prototype.isMethodEnabled = function(sharedMethod) {
  if (!sharedMethod.shared) return false;

  var key = this.getKeyFromMethodNameAndTarget(sharedMethod.name, sharedMethod.isStatic);

  if (this._disabledMethods.hasOwnProperty(key)) {
    return false;
  }

  return true;
};

/**
 * Define a shared method with the given name.
 *
 * @param {String} name The method name
 * @param {Object} [options] Set of options used to create a `SharedMethod`.
 * [See the full set of options](#sharedmethod-new-sharedmethodfn-name-sharedclass-options)
 */

SharedClass.prototype.defineMethod = function(name, options, fn) {
  return _define.call(this, this._methods, name, options, fn);
};

function _define(methods, name, options, fn) {
  options = options || {};
  var sharedMethod = new SharedMethod(fn, name, this, options);
  methods.push(sharedMethod);
  return sharedMethod;
}

/**
 * Define a shared method resolver for dynamically defining methods.
 *
 * ```js
 * // below is a simple example
 * sharedClass.resolve(function(define) {
 *   define('myMethod', {
 *     accepts: {arg: 'str', type: 'string'},
 *     returns: {arg: 'str', type: 'string'}
 *     errors: [ { code: 404, message: 'Not Found', responseModel: 'Error' } ]
 *   }, myMethod);
 * });
 * function myMethod(str, cb) {
 *   cb(null, str);
 * }
 * ```
 *
 * @param {Function} resolver
 */

SharedClass.prototype.resolve = function(resolver) {
  this._resolvers.push(resolver);
};

/**
 * Find a sharedMethod with the given name or function object.
 *
 * @param {String|Function} fn The function or method name
 * @param {Boolean} [isStatic] Required if `fn` is a `String`.
 * Only find a static method with the given name.
 * @returns {SharedMethod}
 */

SharedClass.prototype.find = function(fn, isStatic) {
  var methods = this.methods();
  return find(methods, fn, isStatic);
};

/**
 * Disable a sharedMethod with the given name or function object.
 *
 * @param {String} fn The function or method name
 * @param {Boolean} isStatic Disable a static or prototype method
 */

SharedClass.prototype.disableMethod = function(fn, isStatic) {
  var disableMethods = this._disabledMethods;
  var key = this.getKeyFromMethodNameAndTarget(fn, isStatic);
  disableMethods[key] = true;
};

/**
 * Get a key for the given method.
 *
 * @param {String} fn The function or method name
 * @param {Boolean} isStatic
 */

SharedClass.prototype.getKeyFromMethodNameAndTarget = function(name, isStatic) {
  return (isStatic ? '' : 'prototype.') + name;
};

function find(methods, fn, isStatic) {
  for (var i = 0; i < methods.length; i++) {
    var method = methods[i];
    if (method.isDelegateFor(fn, isStatic)) return method;
  }
  return null;
}

function eachRemoteFunctionInObject(obj, f) {
  if (!obj) return;

  for (var key in obj) {
    if (key === 'super_') {
      // Skip super class
      continue;
    }
    var fn;

    try {
      fn = obj[key];
    } catch (e) {
    }

    // HACK: [rfeng] Do not expose model constructors
    // We have the following usage to set other model classes as properties
    // User.email = Email;
    // User.accessToken = AccessToken;
    // Both Email and AccessToken can have shared flag set to true
    if (typeof fn === 'function' && fn.shared && !fn.modelName) {
      f(fn, key);
    }
  }
}
