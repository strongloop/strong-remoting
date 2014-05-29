/*!
 * Expose `RestAdapter`.
 */

module.exports = RestAdapter;

RestAdapter.RestClass = RestClass;
RestAdapter.RestMethod = RestMethod;

/*!
 * Module dependencies.
 */

var EventEmitter = require('events').EventEmitter
  , debug = require('debug')('strong-remoting:rest-adapter')
  , util = require('util')
  , inherits = util.inherits
  , assert = require('assert')
  , express = require('express')
  , cors = require('cors')
  , async = require('async')
  , HttpInvocation = require('./http-invocation')
  , HttpContext = require('./http-context');

/**
 * Create a new `RestAdapter` with the given `options`.
 *
 * @param {Object} options
 * @return {RestAdapter}
 */

function RestAdapter(remotes) {
  EventEmitter.call(this);

  this.remotes = remotes;
  this.Context = HttpContext;
}

/**
 * Inherit from `EventEmitter`.
 */

inherits(RestAdapter, EventEmitter);

/*!
 * Simplified APIs
 */

RestAdapter.create =
RestAdapter.createRestAdapter = function (remotes) {
  // add simplified construction / sugar here
  return new RestAdapter(remotes);
}

/**
 * Get the path for the given method.
 */

RestAdapter.prototype.getRoutes = getRoutes;
function getRoutes(obj) {
  var routes = obj.http;

  if(routes && !Array.isArray(routes)) {
    routes = [routes];
  }

  // overidden
  if(routes) {
    // patch missing verbs / routes
    routes.forEach(function (r) {
      r.verb = String(r.verb || 'all').toLowerCase();
      r.path = r.path || ('/' + obj.name);
    });
  } else {
    if(obj.name === 'sharedCtor') {
      routes = [{
        verb: 'all',
        path: '/prototype'
      }];
    } else {
      // build default route
      routes = [{
        verb: 'all',
        path: obj.name ? ('/' + obj.name) : ''
      }];
    }
  }

  return routes;
}

RestAdapter.prototype.connect = function(url) {
  this.connection = url;
}

RestAdapter.prototype.invoke = function(method, args, callback) {
  assert(this.connection, 'Cannot invoke method without a connection. See RemoteObjects#connect().');
  assert(typeof method === 'string', 'method is required when calling invoke()');
  
  var lastArg = arguments[arguments.length - 1];
  args = Array.isArray(args) ? args : [];
  
  callback = typeof lastArg === 'function' ? lastArg : undefined;
  
  var restMethod = this.getRestMethodByName(method);
  var invocation = new HttpInvocation(restMethod, args, this.connection);
  invocation.invoke(callback);
}

RestAdapter.prototype.getRestMethodByName = function(name) {
  var classes = this.getClasses();
  for(var i = 0; i < classes.length; i++) {
    var restClass = classes[i];
    for(var j = 0; j < restClass.methods.length; j++) {
      var restMethod = restClass.methods[j];
      if(restMethod.fullName === name) {
        return restMethod;
      }
    }
  }
}

RestAdapter.prototype.createHandler = function () {
  var root = express();
  root.disable('x-powered-by');
  var adapter = this;
  var classes = this.getClasses();

  // Add a handler to tolerate empty json as connect's json middleware throws an error
  root.use(function(req, res, next) {
    if(req.is('application/json')) {
        if(req.get('Content-Length') === '0') { // This doesn't cover the transfer-encoding: chunked
            req._body = true; // Mark it as parsed
            req.body = {};
        }
    }
    next();
  });

  // Set strict to be `false` so that anything `JSON.parse()` accepts will be parsed
  debug("remoting options: %j", this.remotes.options);
  var urlencodedOptions = this.remotes.options.urlencoded || {};
  var jsonOptions = this.remotes.options.json || {strict: false};
  var corsOptions = this.remotes.options.cors || {};
  root.use(express.urlencoded(urlencodedOptions));
  root.use(express.json(jsonOptions));
  root.use(cors(corsOptions));

  classes.forEach(function (restClass) {
    var app = express();
    app.disable('x-powered-by');
    var className = restClass.sharedClass.name;

    debug('registering REST handler for class %j', className);

    // Register handlers for all shared methods of this class sharedClass
    restClass
      .methods
      .forEach(function(restMethod) {
        var sharedMethod = restMethod.sharedMethod;
        debug('    method %s', sharedMethod.stringName);
        restMethod.routes.forEach(function(route) {
          adapter._registerMethodRouteHandlers(app, sharedMethod, route);
        });
      });

    // Convert requests for unknown methods of this sharedClass into 404.
    // Do not allow other middleware to invade our URL space.
    app.use(RestAdapter.remoteMethodNotFoundHandler(className));

    // Mount the remoteClass app on all class routes.
    restClass
      .routes
      .forEach(function (route) {
        debug('    at %s', route.path);
        root.use(route.path, app);
      });

    // sort app routes
    Object
      .keys(app.routes)
      .forEach(function (key) {
        if(Array.isArray(app.routes[key])) {
          app.routes[key] = app.routes[key].sort(sortRoutes);
        }
      });
  });

  // Convert requests for unknown URLs into 404.
  // Do not allow other middleware to invade our URL space.
  root.use(RestAdapter.urlNotFoundHandler());

  // Use our own error handler to make sure the error response has
  // always the format expected by remoting clients.
  root.use(RestAdapter.errorHandler());

  return root;
};

RestAdapter.remoteMethodNotFoundHandler = function(className) {
  className = className || '(unknown)';
  return function restRemoteMethodNotFound(req, res, next) {
    var message = 'Shared class "' + className + '"' +
      ' has no method handling ' + req.method + ' ' + req.url;
    var error = new Error(message);
    error.status = error.statusCode = 404;
    next(error);
  };
};

RestAdapter.urlNotFoundHandler = function() {
  return function restUrlNotFound(req, res, next) {
    var message = 'There is no method to handle ' + req.method + ' ' + req.url;
    var error = new Error(message);
    error.status = error.statusCode = 404;
    next(error);
  };
};

RestAdapter.errorHandler = function() {
  return function restErrorHandler(err, req, res, next) {
    if(typeof err === 'string') {
      err = new Error(err);
      err.status = err.statusCode = 500;
    }

    res.statusCode = err.statusCode || err.status || 500;

    debug('Error in %s %s: %s', req.method, req.url, err.stack);
    var data = {
      name: err.name,
      status: res.statusCode,
      message: err.message || 'An unknown error occurred'
    };

    for (var prop in err)
      data[prop] = err[prop];

    // TODO(bajtos) Remove stack info when running in production
    data.stack = err.stack;

    res.send({ error: data });
  };
};

RestAdapter.prototype._registerMethodRouteHandlers = function(app,
                                                              sharedMethod,
                                                              route) {
  var handler = sharedMethod.isStatic ?
    this._createStaticMethodHandler(sharedMethod) :
    this._createPrototypeMethodHandler(sharedMethod);

  debug('        %s %s %s', route.verb, route.path, handler.name);
  app[route.verb](route.path, handler);
};

RestAdapter.prototype._createStaticMethodHandler = function(sharedMethod) {
  var self = this;
  var Context = this.Context;

  return function restStaticMethodHandler(req, res, next) {
    var ctx = new Context(req, res, sharedMethod);
    self._invokeMethod(ctx, sharedMethod, next);
  };
};

RestAdapter.prototype._createPrototypeMethodHandler = function(sharedMethod) {
  var self = this;
  var Context = this.Context;

  return function restPrototypeMethodHandler(req, res, next) {
    var ctx = new Context(req, res, sharedMethod);

    // invoke the shared constructor to get an instance
    ctx.invoke(sharedMethod.ctor, sharedMethod.sharedCtor, function(err, inst) {
      if (err) return next(err);
      ctx.instance = inst;
      self._invokeMethod(ctx, sharedMethod, next);
    }, true);
  };
};

RestAdapter.prototype._invokeMethod = function(ctx, method, next) {
  var remotes = this.remotes;
  var steps = [];

  if (method.rest.before) {
    steps.push(function invokeRestBefore(cb) {
      debug('Invoking rest.before for ' + ctx.methodString);
      method.rest.before.call(remotes.getScope(ctx, method), ctx, cb);
    });
  }

  steps.push(
    this.remotes.invokeMethodInContext.bind(this.remotes, ctx, method)
  );

  if (method.rest.after) {
    steps.push(function invokeRestAfter(cb) {
      debug('Invoking rest.after for ' + ctx.methodString);
      method.rest.after.call(remotes.getScope(ctx, method), ctx, cb);
    });
  }

  async.series(
    steps,
    function(err) {
      if (err) return next(err);
      ctx.done();
      // Do not call next middleware, the request is handled
    }
  );
};

RestAdapter.prototype.allRoutes = function () {
  var routes = [];
  var adapter = this;
  var remotes = this.remotes;
  var Context = this.Context;
  var classes = this.remotes.classes();
  var currentRoot = '';

  classes.forEach(function (sc) {


    adapter
      .getRoutes(sc)
      .forEach(function (classRoute) {
        currentRoot = classRoute.path;
        var methods = sc.methods();

        methods.forEach(function (method) {
          adapter.getRoutes(method).forEach(function (route) {
            if(method.isStatic) {
              addRoute(route.verb, route.path, method);
            } else {
              adapter
                .getRoutes(method.sharedCtor)
                .forEach(function (sharedCtorRoute) {
                  addRoute(route.verb, sharedCtorRoute.path + route.path, method);
                });
            }
          });
        });
      });
  });

  return routes;


  function addRoute(verb, path, method) {
    if(path === '/' || path === '//') {
      path = currentRoot;
    } else {
      path = currentRoot + path;
    }

    if(path[path.length - 1] === '/') {
      path = path.substr(0, path.length - 1);
    }

    // TODO this could be cleaner
    path = path.replace(/\/\//g, '/');

    routes.push({
      verb: verb,
      path: path,
      description: method.description,
      method: method.stringName,
      accepts: (method.accepts && method.accepts.length) ? method.accepts : undefined,
      returns: (method.returns && method.returns.length) ? method.returns : undefined
    });
  }
}

RestAdapter.prototype.getClasses = function() {
  return this.remotes.classes().map(function(c) {
    return new RestClass(c);
  });
};

// path part routes should
// not override explicit routes
function sortRoutes(a, b) {
  if(a.path[1] === ':') {
    return 1;
  } else {
    return -1;
  }
}

function RestClass(sharedClass) {
  nonEnumerableConstPropery(this, 'sharedClass', sharedClass);

  this.name = sharedClass.name;
  this.routes = getRoutes(sharedClass);

  this.ctor = sharedClass.sharedCtor &&
    new RestMethod(this, sharedClass.sharedCtor);

  this.methods = sharedClass.methods()
    .filter(function(sm) { return !sm.isSharedCtor; })
    .map(function(sm) {
      return new RestMethod(this, sm);
    }.bind(this));
}

RestClass.prototype.getPath = function() {
  return this.routes[0].path;
};

function RestMethod(restClass, sharedMethod) {
  nonEnumerableConstPropery(this, 'restClass', restClass);
  nonEnumerableConstPropery(this, 'sharedMethod', sharedMethod);

  // The full name is ClassName.methodName or ClassName.prototype.methodName
  this.fullName = sharedMethod.stringName;
  this.name = this.fullName.split('.').slice(1).join('.');

  this.accepts = sharedMethod.accepts;
  this.returns = sharedMethod.returns;
  this.description = sharedMethod.description;

  var methodRoutes = getRoutes(sharedMethod);
  if (sharedMethod.isStatic || !restClass.ctor) {
    this.routes = methodRoutes;
  } else {
    var routes = this.routes = [];
    methodRoutes.forEach(function(route) {
      restClass.ctor.routes.forEach(function(ctorRoute) {
        var fullRoute = util._extend({}, route);
        fullRoute.path = joinPaths(ctorRoute.path, route.path);
        routes.push(fullRoute);
      });
    });
  }
}

RestMethod.prototype.isReturningArray = function() {
  return this.returns.length == 1 &&
    this.returns[0].root &&
    getTypeString(this.returns[0].type) === 'array' || false;
};

RestMethod.prototype.acceptsSingleBodyArgument = function() {
  if (this.accepts.length != 1) return false;
  var accepts = this.accepts[0];

  return accepts.http &&
    accepts.http.source == 'body' &&
    getTypeString(accepts.type) == 'object' || false;
};

RestMethod.prototype.getHttpMethod = function() {
  var verb = this.routes[0].verb;
  if (verb == 'all') return 'POST';
  if (verb == 'del') return 'DELETE';
  return verb.toUpperCase();
};

RestMethod.prototype.getPath = function() {
  return this.routes[0].path;
};

RestMethod.prototype.getFullPath = function() {
  return joinPaths(this.restClass.getPath(), this.getPath());
};

function getTypeString(ctorOrName) {
  if (typeof ctorOrName === 'function')
    ctorOrName = ctorOrName.name;
  if (typeof ctorOrName === 'string') {
    return ctorOrName.toLowerCase();
  } else {
    debug('WARNING: unkown ctorOrName of type %s: %j',
      typeof ctorOrName, ctorOrName);
    return typeof undefined;
  }
}

function nonEnumerableConstPropery(object, name, value) {
  Object.defineProperty(object, name, {
    value: value,
    enumerable: false,
    writable: false,
    configurable: false
  });
}

function joinPaths(left, right) {
  if (!left) return right;
  if (!right || right == '/') return left;

  var glue = left[left.length-1] + right[0];
  if (glue == '//')
    return left + right.slice(1);
  else if (glue[0] == '/' || glue[1] == '/')
    return left + right;
  else
    return left + '/' + right;
}
