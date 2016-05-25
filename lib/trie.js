
module.exports = Trie;

function Trie() {
  this.methods = {};
}

// insert new nodes to Trie
Trie.prototype.add = function(route, handler) {
  var node = this;
  var parts = getPathParts(route.fullPath);
  var segment;

  if (!parts.length) {
    addVerbHandler(node, route, handler);
    return this;
  }
  for (var i = 0; i < parts.length; i++) {
    segment = parts[i];
    if (!(segment in node)) {
      node[segment] = new Trie();
      node.param = (segment[0] === ':');
    }
    if (i + 1 === parts.length) {
      addVerbHandler(node[segment], route, handler);
    }
    node = node[segment];
  }

  return this;
};

// Look for matching path and return methods for a match
Trie.prototype.find = function(path) {
  var node = this;
  var parts = getPathParts(path);
  var segment;

  for (var i = 0; i < parts.length; i++) {
    segment = parts[i];
    if (!(segment in node) && !node.param) return false;
    if (node.param) {
      segment = Object.keys(node).find(function(key) {
        if (key[0] === ':') return key;
      });
      return node[segment].methods;
    }
    if (i + 1 === parts.length) return node[segment].methods;
    node = node[segment];
  }
};

function getPathParts(path) {
  return path.trim().split('/').filter(Boolean);
}

function addVerbHandler(node, route, handler) {
  node.methods = node.methods || {};
  var verb = route.verb;
  if (node.methods[verb]) {
    console.warn(
      'WARN: A handler was already registered for %s /api%s : Ignoring the new handler %s',
      route.verb.toUpperCase(),
      route.fullPath || '/[unknown]',
      handler.methodName || '<unknown>'
      );
    return;
  }
  node.methods[verb] = handler;
}
