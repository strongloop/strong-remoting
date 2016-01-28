module.exports = RestRouter;

var Trie = require('./trie');

function RestRouter(opts) {
  this.Trie = new Trie();
  this.opts = opts;
};

//register path and related handler to Trie ds
RestRouter.prototype.registerPathAndHandlers = function (route, method) {
  var path = getPath(route.fullPath);
  var Trie = this.Trie;
  Trie = Trie.add(path, route.verb, method);
};

//handle request, match path and if found, invoke handler method
RestRouter.prototype.handle = function () {
  var Trie = this.Trie;
  return function (req, res, next) {
    var verb = req.method.toLowerCase() || 'all'
    var path = getPath(req.url)
    var methods = Trie.find(path);
    if (methods && verb in methods) {
      methods[verb](req, res, next);
    }
    else next();
  }
}

function getPath(path) {
  if (!this.opts || !(this.opts.caseSensitive)) {
    path = path.toLowerCase();
  }
  return path;
}