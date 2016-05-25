
var url = require('url');
var http = require('http');
var Trie = require('./trie');

var HTTP_METHODS = getCurrentNodeMethods();

var RestRouter = module.exports = function(options) {
  var opts = options || {};
  var router = function(req, res, next) {
    router.handle(req, res, next);
  };

  router.__proto__ = RestRouter;
  router._trie = new Trie();
  router.options = opts;

  return router;
};

// express style API for registering route handlers: ex. route[method](path, handler)
// add verb:handler for path to trie DS
HTTP_METHODS.concat('all').forEach(function(method) {
  RestRouter[method] = function(route, handler) {
    route.fullPath = normalizePath(route.fullPath, this.opts);
    var trie = this._trie;
    trie = trie.add(route, handler);
    return this;
  };
});

// handle request, match path and if found, invoke handler method
RestRouter.handle = function(req, res, next) {
  var trie = this._trie;
  var verb = req.method.toLowerCase();
  var path = normalizePath(req.url, this.options);
  var methods = trie.find(path);

  if (methods && verb in methods) {
    methods[verb](req, res, next);
  } else {
    next();
  }
};

// For now: exclude paths with parameters like :id
// and handler functions with err obj i.e. (err, req, res, next)

// RestRouter.canRegister = function(route, handler) {
//   return !(route.path.includes(':') && handler.length < 4);
// };

function normalizePath(path, options) {
  path = url.parse(path).pathname;
  if (!options || !(options.caseSensitive)) {
    path = path.toLowerCase();
  }
  return path;
}

// get list of all HTTP methods
function getCurrentNodeMethods() {
  return http.METHODS && http.METHODS.map(function lowerCaseMethod(method) {
    return method.toLowerCase();
  });
}
