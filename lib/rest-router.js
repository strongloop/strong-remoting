var url = require('url');
var http = require('http');
var routerLookup = require('./router-lookup');

var HTTP_METHODS = require('methods');

var RestRouter = module.exports = function(options) {
  var options = options || {};

  var router = function(req, res, next) {
    router.handle(req, res, next);
  };

  router.__proto__ = RestRouter;
  router._lookup = new routerLookup();
  router.options = options;

  return router;
};

HTTP_METHODS.concat('all').forEach(function(method) {
  RestRouter[method] = function(verb, fullPath, handler) {
    fullPath = normalizePath(fullPath, this.options);
    this._lookup.addNode(verb, fullPath, handler);
    return this;
  };
});

RestRouter.handle = function(req, res, next) {
  var lookup = this._lookup;
  var verb = req.method.toLowerCase();
  var path = normalizePath(req.url, this.options);
  var methods = lookup.matchRequestPath(path, req);

  if (methods && verb in methods) {
    methods[verb](req, res, next);
  } else {
    next();
  }
};

// TODO
// include handler functions with 4 args (err, req, res, next)


// function needs to be improved based on all edge cases
RestRouter.canHandle = function(verb, fullPath, handler) {
  return handler.length === 3;
};

function normalizePath(path, options) {
  path = url.parse(path).pathname;

  if (!options || !options.caseSensitive) path = path.toLowerCase();

  return path;
}
