/**
 * Expose `SharedClass`.
 */

module.exports = SharedClass;

/**
 * Module dependencies.
 */

var debug = require('debug')('strong-remoting:shared-class')
  , util = require('util')
  , inherits = util.inherits
  , SharedMethod = require('./shared-method')
  , assert = require('assert');
  
/**
 * Create a new `SharedClass` with the given `options`.
 *
 * @param {Object} options
 * @return {SharedClass}
 */

function SharedClass(name, ctor) {
  this.name = name || ctor.remoteNamespace;
  this.ctor = ctor;
  this._methods = [];
  this._resolvers = [];
  var http = ctor && ctor.http;
  var defaultHttp = { path: '/' + this.name };

  if(Array.isArray(http)) {
    // use array as is
    this.http = http;
    if(http.length === 0) {
      http.push(defaultHttp);
    }
  } else {
    // set http.path using the name unless it is defined
    // TODO(ritch) move http normalization from adapter.getRoutes() to a
    // better place... eg SharedMethod#getRoutes() or RestClass
    this.http = util._extend(defaultHttp, http);
  }

  if (typeof ctor === 'function') {
    // TODO(schoon) - Can we fall back to using the ctor as a method directly?
    // Without that, all remote methods have to be two levels deep, e.g.
    // `/meta/routes`.

    // remove requirement for sharedCtor
    // assert(ctor.sharedCtor, 'must define a sharedCtor');
    this.sharedCtor = new SharedMethod(ctor.sharedCtor, 'sharedCtor', this);
  }
  assert(this.name, 'must include a remoteNamespace when creating a SharedClass');
}

/**
 * Get all shared methods.
 */

SharedClass.prototype.methods = function () {
  var ctor = this.ctor;
  var methods = [];
  var sc = this;
  var functionIndex = [];

  // static methods
  eachRemoteFunctionInObject(ctor, function (fn, name) {
    if(functionIndex.indexOf(fn) === -1) {
      functionIndex.push(fn);
    } else {
      return;
    }
    methods.push(SharedMethod.fromFunction(fn, name, sc, true));
  });
  
  // instance methods
  eachRemoteFunctionInObject(ctor.prototype, function (fn, name) {
    if(functionIndex.indexOf(fn) === -1) {
      functionIndex.push(fn);
    } else {
      return;
    }
    methods.push(SharedMethod.fromFunction(fn, name, sc));
  });

  // resolvers
  this._resolvers.forEach(function(resolver) {
    resolver.call(this, define.bind(sc, methods));
  });
  
  methods = methods.concat(this._methods);

  return methods.filter(function(sharedMethod) {
    return sharedMethod.shared === true;
  });
}

/**
 * Define a shared method with the given name.
 *
 * @param {String} name The method name
 * @param {Object} [options]
 * @param {Boolean} [options.prototype] `true` if the method is on the prototype
 */

SharedClass.prototype.defineMethod = function(name, options, fn) {
  define.call(this, this._methods, name, options, fn);
}

function define(methods, name, options, fn) {
  options = options || {};
  var isStatic = options.isStatic;
  methods.push(new SharedMethod(fn, name, this, options));
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
}

function eachRemoteFunctionInObject(obj, f) {
  if(!obj) return;
    
  for(var key in obj) {
    if(key === 'super_') {
      // Skip super class
      continue;
    }
    var fn;
     
    try {
      fn = obj[key];
    } catch(e) {
    }
    
    if(typeof fn === 'function' && fn.shared) {
      f(fn, key);
    }
  }
}
