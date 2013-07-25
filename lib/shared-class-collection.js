/**
 * Expose `SharedClassCollection`.
 */

module.exports = SharedClassCollection;

/**
 * Module dependencies.
 */

var EventEmitter = require('eventemitter2').EventEmitter2
  , debug = require('debug')('remotes')
  , util = require('util')
  , inherits = util.inherits
  , assert = require('assert')
  , SharedClass = require('./shared-class')
  , ExportsHelper = require('./exports-helper');

/**
 * Create a new `SharedClassCollection` with the given `options`.
 *
 * @param {Object} options
 * @return {SharedClassCollection}
 */

function SharedClassCollection(options) {
  EventEmitter.call(this, {wildcard: true});
  this.options = options || {};
  this.exports = this.options.exports || {};
}

/**
 * Inherit from `EventEmitter`.
 */

inherits(SharedClassCollection, EventEmitter);

/*!
 * Simplified APIs
 */

SharedClassCollection.create = function (options) {
  return new SharedClassCollection(options);
}

SharedClassCollection.extend = function (exports) {
  return new ExportsHelper(exports);
}

/**
 * Create a handler from the given adapter.
 *
 * @param {String} adapter name
 * @return {Function}
 */

// TODO(schoon) - Add options support.
SharedClassCollection.prototype.handler = function (name, server) {
  var Adapter = this.adapter(name);
  var adapter = new Adapter(this, server);
  var handler = adapter.createHandler();

  if(handler) {
    // allow adapter reference from handler
    handler.adapter = adapter;
  }

  return handler;
}

/**
 * Get an adapter by name.
 * @param {String} adapter name
 * @return {Adapter}
 */

SharedClassCollection.prototype.adapter = function (name) {
  return require('./' + name + '-adapter');
}

/**
 * Get all classes.
 */

SharedClassCollection.prototype.classes = function () {
  var exports = this.exports;

  return Object
    .keys(exports)
    .map(function (name) {
      return new SharedClass(name, exports[name]);
    });
}

/**
 * Find a method by its string name.
 */

SharedClassCollection.prototype.findMethod = function (methodString) {
  var methods = this.methods();

  for (var i = 0; i < methods.length; i++) {
    if(methods[i].stringName === methodString) return methods[i];
  }
}

/**
 * Get all methods.
 */

SharedClassCollection.prototype.methods = function () {
  var methods = [];

  this
    .classes()
    .forEach(function (sc) {
      methods = sc.methods().concat(methods);
    });

  return methods;
}

/**
 * Get as JSON.
 */

SharedClassCollection.prototype.toJSON = function () {
  var result = {};
  var methods = this.methods();

  methods.forEach(function (sharedMethod) {
    result[sharedMethod.stringName] = {
      http: sharedMethod.fn && sharedMethod.fn.http,
      accepts: sharedMethod.accepts,
      returns: sharedMethod.returns
    };
  });

  return result;
}

/**
 * Execute the given function before the matched method string.
 */

SharedClassCollection.prototype.before = function (methodMatch, fn) {
  this.on('before.' + methodMatch, fn);
}

/**
 * Execute the given function after the matched method string.
 */

SharedClassCollection.prototype.after = function (methodMatch, fn) {
  this.on('after.' + methodMatch, fn);
}

/**
 * Create a middleware style emit that supports wildcards.
 */

SharedClassCollection.prototype.execHooks = function(when, method, scope, ctx, next) {
  var stack = [];
  var ee = this;
  var type = when + '.' + method.sharedClass.name + (method.isStatic ? '.' : '.prototype.') + method.name;

  this._events || init.call(this);

  var handler;

  // context
  this.objectName = method.sharedClass.name;
  this.methodName = method.name;

  if(this.wildcard) {
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
    var l = arguments.length;
    var args = new Array(l - 1);
    for (var i = 1; i < l; i++) args[i - 1] = arguments[i];

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      addToStack(listeners[i]);
    }
  }

  function addToStack(fn) {
    stack.push(fn);
  }

  function execStack(err) {
    if(err) return next(err);

    var cur = stack.shift();

    if(cur) {
      cur.call(scope, ctx, execStack, method);
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
  var listeners=[], leaf, len, branch, xTree, xxTree, isolatedBranch, endReached,
      typeLength = type.length, currentType = type[i], nextType = type[i+1];
  if (i === typeLength && tree._listeners) {
    //
    // If at the end of the event(s) list and the tree has listeners
    // invoke those listeners.
    //
    if (typeof tree._listeners === 'function') {
      handlers && handlers.push(tree._listeners);
      return [tree];
    } else {
      for (leaf = 0, len = tree._listeners.length; leaf < len; leaf++) {
        handlers && handlers.push(tree._listeners[leaf]);
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
          listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i+1));
        }
      }
      return listeners;
    } else if(currentType === '**') {
      endReached = (i+1 === typeLength || (i+2 === typeLength && nextType === '*'));
      if(endReached && tree._listeners) {
        // The next element has a _listeners, add it to the handlers.
        listeners = listeners.concat(searchListenerTree(handlers, type, tree, typeLength));
      }

      for (branch in tree) {
        if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
          if(branch === '*' || branch === '**') {
            if(tree[branch]._listeners && !endReached) {
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], typeLength));
            }
            listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
          } else if(branch === nextType) {
            listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i+2));
          } else {
            // No match on this one, shift into the tree but not in the type array.
            listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
          }
        }
      }
      return listeners;
    }

    listeners = listeners.concat(searchListenerTree(handlers, type, tree[currentType], i+1));
  }

  xTree = tree['*'];
  if (xTree) {
    //
    // If the listener tree will allow any match for this part,
    // then recursively explore all branches of the tree
    //
    searchListenerTree(handlers, type, xTree, i+1);
  }

  xxTree = tree['**'];
  if(xxTree) {
    if(i < typeLength) {
      if(xxTree._listeners) {
        // If we have a listener on a '**', it will catch all, so add its handler.
        searchListenerTree(handlers, type, xxTree, typeLength);
      }

      // Build arrays of matching next branches and others.
      for(branch in xxTree) {
        if(branch !== '_listeners' && xxTree.hasOwnProperty(branch)) {
          if(branch === nextType) {
            // We know the next element will match, so jump twice.
            searchListenerTree(handlers, type, xxTree[branch], i+2);
          } else if(branch === currentType) {
            // Current node matches, move into the tree.
            searchListenerTree(handlers, type, xxTree[branch], i+1);
          } else {
            isolatedBranch = {};
            isolatedBranch[branch] = xxTree[branch];
            searchListenerTree(handlers, type, { '**': isolatedBranch }, i+1);
          }
        }
      }
    } else if(xxTree._listeners) {
      // We have reached the end and still on a '**'
      searchListenerTree(handlers, type, xxTree, typeLength);
    } else if(xxTree['*'] && xxTree['*']._listeners) {
      searchListenerTree(handlers, type, xxTree['*'], typeLength);
    }
  }

  return listeners;
}
