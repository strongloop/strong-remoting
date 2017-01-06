// Copyright IBM Corp. 2013,2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var g = require('strong-globalize')();
/*!
 * Expose `RemoteObjects`.
 */
module.exports = RemoteObjects;

/*!
 * Module dependencies.
 */

var EventEmitter = require('eventemitter2').EventEmitter2;
var debug = require('debug')('strong-remoting:remotes');
var deprecated = require('depd')('strong-remoting');
var util = require('util');
var urlUtil = require('url');
var inherits = util.inherits;
var assert = require('assert');
var SharedClass = require('./shared-class');
var SharedMethod = require('./shared-method');
var ExportsHelper = require('./exports-helper');
var PhaseList = require('loopback-phase').PhaseList;
var TypeRegistry = require('./type-registry');

// require the rest adapter for browserification
// TODO(ritch) remove this somehow...?
require('./rest-adapter');

/**
 * Create a new `RemoteObjects` with the given `options`.
 *
 * ```js
 * var remoteObjects = require('strong-remoting').create();
 * ```
 *
 * @param {Object} options
 * @return {RemoteObjects}
 * @class
 * @property {Object} auth Authentication options used by underlying adapters
 * to set authorization metadata. **The `rest` adapter supports:**
 *
 *  - **basic** - `username` and `password` are required.
 *  - **digest** - `username` and `password` required and `sendImmediately` must
 * be false.
 *  - **bearer** - `bearer` must be set as the bearer token
 *
 * @property {String} auth.username
 * @property {String} auth.password
 * @property {String} auth.bearer The **bearer token**.
 * @property {Boolean} auth.sendImmediately Defaults to `false`.
 */

function RemoteObjects(options) {
  EventEmitter.call(this, {wildcard: true});
  // Avoid warning: possible EventEmitter memory leak detected
  this.setMaxListeners(16);
  this.options = options || {};
  this.exports = this.options.exports || {};
  this._typeRegistry = new TypeRegistry(this.options.types);
  this._classes = {};

  this._setupPhases();
}

/*!
 * Inherit from `EventEmitter`.
 */

inherits(RemoteObjects, EventEmitter);

/*!
 * Simplified APIs
 */

RemoteObjects.create = function(options) {
  return new RemoteObjects(options);
};

RemoteObjects.extend = function(exports) {
  return new ExportsHelper(exports);
};

/**
 * Create a handler from the given adapter.
 *
 * @param {String} name Adapter name
 * @param {Object} options Adapter options
 * @return {Function}
 */

RemoteObjects.prototype.handler = function(name, options) {
  var Adapter = this.adapter(name);
  var adapter = new Adapter(this, options);
  var handler = adapter.createHandler();

  if (handler) {
    // allow adapter reference from handler
    handler.adapter = adapter;
  }

  return handler;
};

/**
 * Create a connection to a remoting server.
 *
 * @param {String} url Server root
 * @param {String} name Name of the adapter (eg. "rest")
 */

RemoteObjects.prototype.connect = function(url, name) {
  // parse URL for auth
  var urlWithoutAuth = url;
  var auth;

  var parsedUrl = urlUtil.parse(url);
  // If base parsedUrl contains auth, extract it so we can set it separately
  if (parsedUrl.auth) {
    auth = this.auth = {};
    auth.username = parsedUrl.auth.split(':')[0];
    auth.password = parsedUrl.auth.split(':')[1];
    // set base without auth so request honours our auth options
    delete parsedUrl.auth;
    urlWithoutAuth = urlUtil.format(parsedUrl);
    // ensure a "/" hasn't been appended where there wasn't one before
    if (url[url.length - 1] !== urlWithoutAuth[urlWithoutAuth.length - 1]) {
      urlWithoutAuth = urlWithoutAuth.slice(0, -1);
    }
  }

  var Adapter = this.adapter(name);
  var adapter = new Adapter(this);
  this.serverAdapter = adapter;
  return adapter.connect(urlWithoutAuth);
};

/**
 * Invoke a method on a remote server using the connected adapter.
 *
 * @param {String} method The remote method string
 * @param {String} [ctorArgs] Constructor arguments (for prototype methods)
 * @param {String} [args] Method arguments
 * @callback {Function} [callback] callback
 * @param {Error} err
 * @param {Any} arg...
 * @end
 */

RemoteObjects.prototype.invoke = function(method, ctorArgs, args, callback) {
  assert(this.serverAdapter,
    g.f('Cannot invoke method without an adapter. See {{RemoteObjects#connect().}}'));
  return this.serverAdapter.invoke.apply(this.serverAdapter, arguments, callback);
};

/**
 * Get an adapter by name.
 * @param {String} name The adapter name
 * @return {Adapter}
 */

RemoteObjects.prototype.adapter = function(name) {
  return require('./' + name + '-adapter');
};

/**
 * Get all classes.
 */

RemoteObjects.prototype.classes = function(options) {
  options = options || {};
  var exports = this.exports;
  var result = [];
  var sharedClasses = this._classes;

  Object
    .keys(exports)
    .forEach(function(name) {
      result.push(new SharedClass(name, exports[name], options));
    });

  Object
    .keys(sharedClasses)
    .forEach(function(name) {
      result.push(sharedClasses[name]);
    });

  return result;
};

/**
 * Add a shared class.
 *
 * @param {SharedClass} sharedClass
 */

RemoteObjects.prototype.addClass = function(sharedClass) {
  assert(sharedClass && sharedClass.constructor.name === 'SharedClass',
    g.f('must provide a valid {{SharedClass}}'));
  this._classes[sharedClass.name] = sharedClass;
};

/**
 * Find a method by its string name.
 *
 * @param {String} methodString String specifying the method. For example:
 *
 *  - `MyClass.prototype.myMethod`
 *  - `MyClass.staticMethod`
 *  - `obj.method`
 */

RemoteObjects.prototype.findMethod = function(methodString) {
  var methods = this.methods();

  for (var i = 0; i < methods.length; i++) {
    if (methods[i].stringName === methodString) return methods[i];
  }
};

/**
 * List all methods.
 */

RemoteObjects.prototype.methods = function() {
  var methods = [];

  this
    .classes()
    .forEach(function(sc) {
      methods = sc.methods().concat(methods);
    });

  return methods;
};

/**
 * Get as JSON.
 */

RemoteObjects.prototype.toJSON = function() {
  var result = {};
  var methods = this.methods();

  methods.forEach(function(sharedMethod) {
    result[sharedMethod.stringName] = {
      http: sharedMethod.fn && sharedMethod.fn.http,
      accepts: sharedMethod.accepts,
      returns: sharedMethod.returns,
      errors: sharedMethod.errors,
    };
  });

  return result;
};

/**
 * Execute the given function before the matched method string.
 *
 * @example
 *
 * Do something before the `user.greet` method is called:
 * ```js
 * remotes.before('user.greet', function(ctx, next) {
 *   if ((ctx.req.param('password') || '').toString() !== '1234') {
 *     next(new Error('Bad password!'));
 *   } else {
 *     next();
 *   }
 * });
 * ```
 *
 * Do something before any `user` method:
 * ```js
 * remotes.before('user.*', function(ctx, next) {
 *   console.log('Calling a user method.');
 *   next();
 * });
 * ```
 *
 * Do something before a `dog` instance method:
 * ```js
 * remotes.before('dog.prototype.*', function(ctx, next) {
 *   var dog = this;
 *   console.log('Calling a method on "%s".', dog.name);
 *   next();
 * });
 * ```
 *
 * @param {String} methodMatch The glob to match a method string
 * @callback {Function} hook
 * @param {Context} ctx The adapter specific context
 * @param {Function} next Call with an optional error object
 * @param {SharedMethod} method The SharedMethod object
 */

RemoteObjects.prototype.before = function(methodMatch, fn) {
  this.on('before.' + methodMatch, fn);
};

/**
 * Execute the given `hook` function after the matched method string.
 *
 * @example
 *
 * Do something after the `speak` instance method.
 * NOTE: you cannot cancel a method after it has been called.
 * ```js
 * remotes.after('dog.prototype.speak', function(ctx, next) {
 *   console.log('After speak!');
 *   next();
 * });
 *```
 *
 * Do something before all methods.
 ```js
 * remotes.before('**', function(ctx, next, method) {
 *   console.log('Calling:', method.name);
 *   next();
 * });
 * ```
 *
 * Modify all returned values named `result`.
 * ```js
 * remotes.after('**', function(ctx, next) {
 *   ctx.result += '!!!';
 *   next();
 * });
 * ```
 *
 * @param {String} methodMatch The glob to match a method string
 * @callback {Function} hook
 * @param {Context} ctx The adapter specific context
 * @param {Function} next Call with an optional error object
 * @param {SharedMethod} method The SharedMethod object
 */

RemoteObjects.prototype.after = function(methodMatch, fn) {
  this.on('after.' + methodMatch, fn);
};

/**
 * Execute the given `hook` function after the method matched by the method
 * string failed.
 *
 * @example
 * Do something after the `speak` instance method failed.
 *
 * ```js
 * remotes.afterError('dog.prototype.speak', function(ctx, next) {
 *   console.log('Cannot speak!', ctx.error);
 *   next();
 * });
 * ```
 *
 * Do something before all methods:
 * ```js
 * remotes.afterError('**', function(ctx, next, method) {
 *   console.log('Failed', method.name, ctx.error);
 *   next();
 * });
 * ```
 *
 * Modify all returned errors:
 * ```js
 * remotes.after('**', function(ctx, next) {
 *   if (!ctx.error.details) ctx.result.details = {};
 *   ctx.error.details.info = 'intercepted by a hook';
 *   next();
 * });
 * ```
 *
 * Report a different error:
 * ```js
 * remotes.after('dog.prototype.speak', function(ctx, next) {
 *   console.error(ctx.error);
 *   next(new Error('See server console log for details.'));
 * });
 * ```
 *
 * @param {String} methodMatch The glob to match a method string
 * @callback {Function} hook
 * @param {Context} ctx The adapter specific context
 * @param {Function} next Call with an optional error object
 * @param {SharedMethod} method The SharedMethod object
 */

RemoteObjects.prototype.afterError = function(methodMatch, fn) {
  this.on('afterError.' + methodMatch, fn);
};

RemoteObjects.prototype.registerPhaseHandler = function(phaseName,
                                                        methodNameWildcard,
                                                        handler) {
  var pattern = methodNameWildcard.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
                         // single star matches one segment only
                         .replace(/(^|\.)\*($|\.)/g, '$1[^.]*$2')
                         // double-start match one or more segments
                         .replace(/(^|\.)\*\*($|\.)/g, '$1.*$2');
  var matcher = new RegExp('^' + pattern + '$');

  debug('registerPhaseHandler(%j) -> pattern %j',
        methodNameWildcard,
        pattern);

  this.phases.registerHandler(phaseName, function matchHandler(ctx, next) {
    if (matcher.test(ctx.method.stringName)) {
      handler(ctx, next);
    } else {
      next();
    }
  });
};

/*!
 * Create a middleware style emit that supports wildcards.
 */

RemoteObjects.prototype.execHooks = function(when, method, scope, ctx, next) {
  var stack = [];
  var ee = this;
  var isStatic = method.isStatic ||
    method.sharedMethod && method.sharedMethod.isStatic;
  var type, handler;

  // Commented-out by bajtos: init is not defined.
  // this._events || init.call(this);

  // context
  this.objectName = method.sharedClass && method.sharedClass.name ||
    method.restClass && method.restClass.name;

  this.methodName = method.name;

  if (method.fullName) {
    type = when + '.' + method.fullName;
  } else {
    type = when + '.' + this.objectName +
      (isStatic ? '.' : '.prototype.') + this.methodName;
  }

  if (this.wildcard) {
    handler = [];
    var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
    searchListenerTree.call(this, handler, ns, this.listenerTree, 0);
  } else {
    handler = this._events[type];
  }

  if (typeof handler === 'function') {
    this.event = type;

    addToStack(handler);

    return execStack();
  } else if (handler) {
    var l = arguments.length; // eslint-disable-line one-var
    var i; // eslint-disable-line one-var
    var args = new Array(l - 1);
    for (i = 1; i < l; i++) {
      args[i - 1] = arguments[i];
    }

    var listeners = handler.slice();
    for (i = 0, l = listeners.length; i < l; i++) {
      addToStack(listeners[i]);
    }
  }

  function addToStack(fn) {
    stack.push(fn);
  }

  function execStack(err) {
    if (err) return next(err);

    var cur = stack.shift();

    if (cur) {
      try {
        var result = cur.call(scope, ctx, execStack, method);
        if (result && typeof result.then === 'function') {
          result.then(function() { execStack(); }, next);
        }
      } catch (err) {
        next(err);
      }
    } else {
      next();
    }
  }

  return execStack();
};

// from EventEmitter2
function searchListenerTree(handlers, type, tree, i) {
  if (!tree) {
    return [];
  }

  var listeners = [];
  var leaf, len, branch, xTree, xxTree, isolatedBranch, endReached;
  var typeLength = type.length;
  var currentType = type[i];
  var nextType = type[i + 1];

  if (i === typeLength && tree._listeners) {
    //
    // If at the end of the event(s) list and the tree has listeners
    // invoke those listeners.
    //
    if (typeof tree._listeners === 'function') {
      if (handlers) handlers.push(tree._listeners);
      return [tree];
    } else {
      for (leaf = 0, len = tree._listeners.length; leaf < len; leaf++) {
        if (handlers) handlers.push(tree._listeners[leaf]);
      }
      return [tree];
    }
  }

  if ((currentType === '*' || currentType === '**') || tree[currentType]) {
    //
    // If the event emitted is '*' at this part
    // or there is a concrete match at this patch
    //
    if (currentType === '*') {
      for (branch in tree) {
        if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
          listeners = listeners.concat(
            searchListenerTree(handlers, type, tree[branch], i + 1));
        }
      }
      return listeners;
    } else if (currentType === '**') {
      endReached = (i + 1 === typeLength || (i + 2 === typeLength && nextType === '*'));
      if (endReached && tree._listeners) {
        // The next element has a _listeners, add it to the handlers.
        listeners = listeners.concat(
          searchListenerTree(handlers, type, tree, typeLength));
      }

      for (branch in tree) {
        if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
          if (branch === '*' || branch === '**') {
            if (tree[branch]._listeners && !endReached) {
              listeners = listeners.concat(
                searchListenerTree(handlers, type, tree[branch], typeLength));
            }
            listeners = listeners.concat(
              searchListenerTree(handlers, type, tree[branch], i));
          } else if (branch === nextType) {
            listeners = listeners.concat(
              searchListenerTree(handlers, type, tree[branch], i + 2));
          } else {
            // No match on this one, shift into the tree but not in the type array.
            listeners = listeners.concat(
              searchListenerTree(handlers, type, tree[branch], i));
          }
        }
      }
      return listeners;
    }

    listeners = listeners.concat(
      searchListenerTree(handlers, type, tree[currentType], i + 1));
  }

  xTree = tree['*'];
  if (xTree) {
    //
    // If the listener tree will allow any match for this part,
    // then recursively explore all branches of the tree
    //
    searchListenerTree(handlers, type, xTree, i + 1);
  }

  xxTree = tree['**'];
  if (xxTree) {
    if (i < typeLength) {
      if (xxTree._listeners) {
        // If we have a listener on a '**', it will catch all, so add its handler.
        searchListenerTree(handlers, type, xxTree, typeLength);
      }

      // Build arrays of matching next branches and others.
      for (branch in xxTree) {
        if (branch !== '_listeners' && xxTree.hasOwnProperty(branch)) {
          if (branch === nextType) {
            // We know the next element will match, so jump twice.
            searchListenerTree(handlers, type, xxTree[branch], i + 2);
          } else if (branch === currentType) {
            // Current node matches, move into the tree.
            searchListenerTree(handlers, type, xxTree[branch], i + 1);
          } else {
            isolatedBranch = {};
            isolatedBranch[branch] = xxTree[branch];
            searchListenerTree(handlers, type, {'**': isolatedBranch}, i + 1);
          }
        }
      }
    } else if (xxTree._listeners) {
      // We have reached the end and still on a '**'
      searchListenerTree(handlers, type, xxTree, typeLength);
    } else if (xxTree['*'] && xxTree['*']._listeners) {
      searchListenerTree(handlers, type, xxTree['*'], typeLength);
    }
  }

  return listeners;
}

RemoteObjects.prototype._executeAuthorizationHook = function(ctx, cb) {
  if (typeof this.authorization === 'function') {
    this.authorization(ctx, cb);
  } else {
    process.nextTick(function() {
      cb();
    });
  }
};

RemoteObjects.prototype._setupPhases = function() {
  var self = this;
  self.phases = new PhaseList();
  var auth = self.phases.add('auth');
  var invoke = self.phases.add('invoke');

  auth.use(function phaseAuthorization(ctx, next) {
    self._executeAuthorizationHook(ctx, next);
  });

  invoke.before(function reportSharedCtorError(ctx, next) {
    next(ctx.sharedCtorError);
  });

  invoke.before(function phaseBeforeInvoke(ctx, next) {
    self.execHooks('before', ctx.method, ctx.getScope(), ctx, next);
  });

  invoke.use(function phaseInvoke(ctx, next) {
    ctx.invoke(ctx.getScope(), ctx.method, function(err, result) {
      if (!err) ctx.result = result;
      next(err);
    });
  });

  invoke.after(function phaseAfterInvoke(ctx, next) {
    self.execHooks('after', ctx.method, ctx.getScope(), ctx, next);
  });
};

/**
 * Invoke the given shared method using the supplied context.
 * Execute registered before/after hooks.
 *
 * @param {Object} ctx
 * @param {Object} method
 * @param {function(Error=)} cb
 */
RemoteObjects.prototype.invokeMethodInContext = function(ctx, method, cb) {
  var self = this;
  var scope = ctx.getScope();

  if (cb === undefined && typeof method === 'function') {
    // the new API with two arguments
    cb = method;
    method = ctx.method;
  } else {
    // backwards compatibility: invokeMethodInContext(ctx, method, cb)
    // TODO remove in v3.0
    assert.equal(method, ctx.method);
    deprecated('invokeMethodInContext(ctx, method, cb) is deprecated.' +
      'Pass the method as ctx.method instead.');
  }

  self.phases.run(ctx, function interceptInvocationErrors(err) {
    if (!err) return cb();

    ctx.error = err;
    self.execHooks('afterError', method, scope, ctx, function(hookErr) {
      cb(hookErr || err);
    });
  });
};

/**
 * Determine what scope object to use when invoking the given remote method in
 * the given context.
 * @private
 */

RemoteObjects.prototype.getScope = function(ctx, method) {
  deprecated('remoteObjects.getScope(ctx, method) is deprecated, ' +
    'use ctx.getScope() instead');
  assert.equal(ctx.method, method);
  return ctx.getScope();
};

/**
 * Define a named type conversion. The conversion is used when a
 * `SharedMethod` argument defines a type with the given `name`.
 *
 * See also `remotes.defineObjectType`.
 *
 * @example
 *
 * ```js
 * remotes.defineType('MyType', {
 *   // Convert the raw "value" coming typically from JSON.
 *   // Use the remoting context in "ctx" to access the type registry and
 *   // other request-related information.
 *   fromTypedValue: function(ctx, value) {
 *     if (value === undefined || value === null)
 *       return { value: value };
 *
 *     value = new MyType(value);
 *     var error = this.validate(ctx, value);
 *     return error ? { error: error } : { value: value };
 *   },
 *
 *   // Apply any coercion needed to convert values coming from
 *   // string-only sources like HTTP headers and query string.
 *   //
 *   // A sloppy value is one of:
 *   //  - a string
 *   //  - an array containing sloppy values
 *   //  - an object where property values are sloppy
 *   fromSloppyValue: function(ctx, value) {
 *     var objectConverter = ctx.typeRegistry.getConverter('object');
 *     var result = objectConverter.fromSloppyString(ctx, value);
 *     return result.error ? result : this.fromTypedValue(ctx, result.value);
 *   },
 *
 *   // Perform basic validation of the value. Validations are required to be
 *   // synchronous.
 *   validate: function(ctx, value) {
 *     if (value === undefined || value === null)
 *       return null;
 *     if (typeof value !== 'object' || !(value instanceof MyType) {
 *       return new Error('Value is not an instance of MyType.');
 *     }
 *     return null;
 *   },
 * });
 * ```
 *
 * @param {String} name The type name
 * @param {Object} converter A converter implementing the following methods:
 *
 *   - `fromTypedValue(ctx, value) -> { value } or { error }`
 *   - `fromSloppyValue(ctx, value) -> { value } or { error }`
 *   - `validate(ctx, value) -> error or undefined/null`
 */

RemoteObjects.prototype.defineType = function(name, converter) {
  if (typeof converter === 'function') {
    throw new Error(g.f(
      '%s is no longer supported. Use one of the new APIs instead: %s or %s',
      'remoteObjects.defineType(name, fn)',
      'remoteObjects.defineObjectType(name, factoryFn)',
      'remoteObjects.defineType(name, converter)'));
  }
  this._typeRegistry.defineType(name, converter);
};

/**
 * Define a named type conversion for an object-like type.
 * The conversion is used when a `SharedMethod` argument
 * defines a type with the given `name`.
 *
 * Under the hood, a converter is created that ensures the input data
 * is an object (or sloppy value is coerced to an object) and calls
 * the provided factory function to convert plain data object to
 * a class instance.
 *
 * @example
 *
 * ```js
 * remotes.defineObjectType('MyClass', function(data) {
 *   return new MyClass(data);
 * });
 * ```
 *
 * @param {String} name The type name
 * @param {Function(Object)} factoryFn Factory function creating object
 *   instance from a plain-data object.
 */
RemoteObjects.prototype.defineObjectType = function(name, factoryFn) {
  this._typeRegistry.registerObjectType(name, factoryFn);
};

RemoteObjects.convert =
RemoteObjects.prototype.convert = function(name, fn) {
  throw new Error(g.f(
    'RemoteObjects.convert(name, fn) is no longer supported. ' +
    'Use remoteObjects.defineType(name, converter) instead.'));
};

RemoteObjects.defineType = function(name, fn) {
  throw new Error(g.f(
    'RemoteObjects.defineType(name, fn) is no longer supported. ' +
    'Use remoteObjects.defineType(name, converter) instead.'));
};
