module.exports = Trie;

function Trie() {
  this.methods = {};
}

//insert new nodes to Trie
Trie.prototype.add = function(path, verb, handler) {
  var node = this;
  var parts = getPathParts(path);
  if (parts.length) {
    for (var i = 0; i < parts.length; i++) {
      if (!(parts[i] in node)) {
        node[parts[i]] = new Trie();
      }
      if (i + 1 === parts.length) {
        addVerbHandler(node[parts[i]], verb, handler);
      }
      node = node[parts[i]];
    }
  } else { // if we would ever encounter this situation?
    addVerbHandler(node, verb, handler);
  }
  return this;
};

//Look for matching path and return handler methods for a match
Trie.prototype.find = function(path) {
  var node = this;
  var parts = getPathParts(path);
  for (var i = 0; i < parts.length; i++) {
    if (!(parts[i] in node)) {
      return false;
    } else {
      if (i + 1 === parts.length)
        return node[parts[i]].methods;
    }
    node = node[parts[i]];
  }
};

//helper functions
function getPathParts(path) {
  path = path.trim();
  var chunks = path.split('/');
  var parts = [];
  chunks.forEach(function(chunk) {
    if (chunk) {
      parts.push(chunk);
    }
  });
  return parts;
}

function addVerbHandler(node, verb, handler) {
  node.methods = node.methods || {};
  node.methods[verb] = node.methods[verb] || [];
  node.methods[verb].push(handler);
}
