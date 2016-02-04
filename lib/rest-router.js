module.exports = RestRouter;

var url = require('url');
var Trie = require('./trie');

function RestRouter(options) {
  this.trie = new Trie();
  this.options = options;
}

//register path and related handler to Trie ds
RestRouter.prototype.registerPathAndHandlers = function(route, handler) {
  var path = normalizePath(route.fullPath);
  var trie = this.trie;
  trie = trie.add(path, route.verb, handler);
};

//handle request, match path and if found, invoke handler method
RestRouter.prototype.handle = function() {
  var trie = this.trie;
  return function(req, res, next) {
    var verb = req.method.toLowerCase() || 'all';
    var path = normalizePath(req.url, this.options);
    var methods = trie.find(path);
    if (methods && verb in methods) {
      methods[verb](req, res, next);
    } else next();
  };
};

function normalizePath(path, options) {
  path = url.parse(path).pathname;
  if (!options || !(options.caseSensitive)) {
    path = path.toLowerCase();
  }
  return path;
}
