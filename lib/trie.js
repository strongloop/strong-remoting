module.exports = Trie;

function Trie() {
  this.methods = {}
}

//insert new nodes to Trie
Trie.prototype.add = function (path, verb, handler) {
  var node = this;
  var parts = getPathParts(path);

  if (parts.length) {
    for (var i = 0; i < parts.length; i++) {
      if (!node || !(parts[i] in node)) {
        node[parts[i]] = new Trie();
      }
      if (i + 1 === parts.length) {
        node[parts[i]].methods = node[parts[i]].methods || {};
        node[parts[i]].methods[verb] = handler;
      }
      node = node[parts[i]];
    }
  }
  else { // if we would ever encounter this situation? 
    node.methods = node.methods || {};
    node.methods[verb] = handler;
  }
  return this;
}

//Look for matching path and return handler methods for a match
Trie.prototype.find = function (path) {
  var node = this;
  var parts = getPathParts(path);
  for (var i = 0; i < parts.length; i++) {
    if (!(parts[i] in node)) {
      return false;
    }
    else {
      if (i + 1 === parts.length)
        return node[parts[i]].methods;
    }
    node = node[parts[i]];
  }
}

function getPathParts(path) {
  path = path.trim();
  var chunks = path.split('/');
  var parts = [];
  chunks.forEach(function (chunk) {
    if (chunk = chunk.trim()) {
      parts.push(chunk);
    }
  });
  return parts;
}