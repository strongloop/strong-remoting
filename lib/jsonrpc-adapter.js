// Copyright IBM Corp. 2013,2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

var g = require('strong-globalize')();
/*!
 * Expose `JsonRpcAdapter`.
 */
module.exports = JsonRpcAdapter;

/*!
 * Module dependencies.
 */

var EventEmitter = require('events').EventEmitter;
var debug = require('debug')('strong-remoting:jsonrpc-adapter');
var util = require('util');
var inherits = util.inherits;
var jayson = require('jayson');
var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var HttpContext = require('./http-context');

var json = bodyParser.json;
var urlencoded = bodyParser.urlencoded;

/**
 * Create a new `JsonRpcAdapter` with the given `options`.
 *
 * @param {Object} options
 * @return {JsonRpcAdapter}
 */

function JsonRpcAdapter(remotes) {
  EventEmitter.call(this);

  this.remotes = remotes;
  this.Context = HttpContext;
}

/**
 * Inherit from `EventEmitter`.
 */

inherits(JsonRpcAdapter, EventEmitter);

/*!
 * Simplified APIs
 */

JsonRpcAdapter.create =
  JsonRpcAdapter.createJsonRpcAdapter = function(remotes) {
    // add simplified construction / sugar here
    return new JsonRpcAdapter(remotes);
  };

/**
 * Get the path for the given method.
 */

JsonRpcAdapter.prototype.getRoutes = function(obj) {
  // build default route
  var routes = [
    {
      verb: 'POST',
      path: obj.name ? ('/' + obj.name) : '',
    },
  ];
  return routes;
};

JsonRpcAdapter.errorHandler = function() {
  return function restErrorHandler(err, req, res, next) {
    if (typeof err === 'string') {
      err = new Error(err);
      err.status = err.statusCode = 500;
    }

    res.statusCode = err.statusCode || err.status || 500;

    debug('Error in %s %s: %s', req.method, req.url, err.stack);
    var data = {
      name: err.name,
      status: res.statusCode,
      message: err.message || g.f('An unknown error occurred'),
    };

    for (var prop in err) {
      data[prop] = err[prop];
    }

    // TODO(bajtos) Remove stack info when running in production
    data.stack = err.stack;

    res.send({
      jsonrpc: '2.0',
      error: { code: -32000, message: g.f('Server error'), data: data },
      id: null,
    });
  };
};

// A mock wrapper function to help code generation.
// Note that we can't make it a real function and use .toString() on it because
// that causes a whole world of trouble when we run strong-remoting's unit tests
// with code coverage.
var mockWrapper = [
  'function mockWrapper(method) {',
  '  return function(__args__) {',
  '    var args = Array.prototype.slice.call(arguments);',
  '    if (method.isStatic) {',
  '      method.getFunction().apply(method.ctor, args);',
  '    } else {',
  '      method.sharedCtor.invoke(method, function(err, instance) {',
  '        method.getFunction().apply(instance, args);',
  '      });',
  '    }',
  '  };',
  '}',
].join('\n');

/* istanbul ignore next */
JsonRpcAdapter.prototype.createHandler = function() {
  var root = express.Router();
  var classes = this.remotes.classes();

  // Add a handler to tolerate empty json as connect's json middleware throws an error
  root.use(function(req, res, next) {
    if (req.is('application/json')) {
      if (req.get('Content-Length') === '0') {
        // This doesn't cover the transfer-encoding: chunked
        req._body = true; // Mark it as parsed
        req.body = {};
      }
    }
    next();
  });

  // Set strict to be `false` so that anything `JSON.parse()` accepts will be parsed
  debug('remoting options: %j', this.remotes.options);
  var jsonOptions = this.remotes.options.json || { strict: false };
  var corsOptions = this.remotes.options.cors;
  if (corsOptions === undefined) corsOptions = { origin: true, credentials: false };

  // Optimize the cors handler
  var corsHandler = function(req, res, next) {
    var reqUrl = req.protocol + '://' + req.get('host');
    if (req.method === 'OPTIONS' || reqUrl !== req.get('origin')) {
      cors(corsOptions)(req, res, next);
    } else {
      next();
    }
  };

  // Set up CORS first so that it's always enabled even when parsing errors
  // happen in urlencoded/json
  if (corsOptions)
    root.use(corsHandler);

  root.use(json(jsonOptions));

  root.use(JsonRpcAdapter.errorHandler());

  classes.forEach(function(sc) {
    var server = new jayson.server();
    root.post('/' + sc.name + '/jsonrpc',
      new jayson.server.interfaces.middleware(server, {}));

    var methods = sc.methods();

    methods.forEach(function(method) {
      // Wrap the method so that it will keep its own receiver - the shared class
      var argsNames = '';
      if (method.accepts) {
        argsNames = method.accepts.map(function(item) {
          return item.arg;
        });
        argsNames = argsNames.join(',');
      } else {
        var m = method.getFunction();
        if (m.length > 1) {
          // The method has more args than cb
          // Build dummy param names
          var names = [];
          for (var i = 0; i < m.length - 1; i++) {
            names.push('param' + i);
          }
          argsNames = names.join(',');
        }
      }
      argsNames = argsNames ? argsNames + ',cb' : 'cb';

      // Generate the function based on the wrapper
      // We need to remove the header/footer to get the function body
      var funcBody = mockWrapper.toString().
        replace('function mockWrapper(method) {', '').
        replace('__args__', argsNames).
        replace(/}$/, '');
      /*jslint evil: true */
      var fn = new Function('method', funcBody)(method);
      if (debug.enabled) {
        debug('Generated function: %s', fn.toString());
      }
      server.method(method.name, fn);
    });
  });

  return root;
};

JsonRpcAdapter.prototype.allRoutes = function() {
  var routes = [];
  var adapter = this;
  var classes = this.remotes.classes();
  var currentRoot = '';

  classes.forEach(function(sc) {
    adapter
      .getRoutes(sc)
      .forEach(function(classRoute) {
        currentRoot = classRoute.path;
        var methods = sc.methods();

        var functions = [];
        methods.forEach(function(method) {
          // Use functions to keep track of JS functions to dedupe
          if (functions.indexOf(method.fn) === -1) {
            functions.push(method.fn);
          } else {
            return; // Skip duplicate methods such as X.m1 = X.m2 = function() {...}
          }
          adapter.getRoutes(method).forEach(function(route) {
            if (method.isStatic) {
              addRoute(route.verb, route.path, method);
            } else {
              adapter
                .getRoutes(method.sharedCtor)
                .forEach(function(sharedCtorRoute) {
                  addRoute(route.verb, sharedCtorRoute.path + route.path, method);
                });
            }
          });
        });
      });
  });

  return routes;

  function addRoute(verb, path, method) {
    if (path === '/' || path === '//') {
      path = currentRoot;
    } else {
      path = currentRoot + path;
    }

    if (path[path.length - 1] === '/') {
      path = path.substr(0, path.length - 1);
    }

    // TODO this could be cleaner
    path = path.replace(/\/\//g, '/');

    routes.push({
      verb: verb,
      path: path,
      description: method.description,
      notes: method.notes,
      method: method.stringName,
      accepts: (method.accepts && method.accepts.length) ? method.accepts : undefined,
      returns: (method.returns && method.returns.length) ? method.returns : undefined,
      errors: (method.errors && method.errors.length) ? method.errors : undefined,
    });
  }
};
