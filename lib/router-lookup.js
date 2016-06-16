module.exports = RouterLookup;

function RouterLookup() {
  this.methods = {};
};

// insert new nodes to Trie
RouterLookup.prototype.addNode = function(verb, fullPath, handler) {
  var node = this;
  var parts = getPathParts(fullPath);
  var pathSegment = '';
  // separate the fullPath into it's parts and add as many nodes
  // as there are parts
  if (!parts.length) {
    addHandler(node, verb, fullPath, handler);
    return this;
  }

  for (var i = 0; i < parts.length; i++) {
    pathSegment = parts[i];

    if (!(pathSegment in node)) {
      node[pathSegment] = new RouterLookup();
      node.param = (pathSegment[0] === ':');
    }

    if (i + 1 === parts.length) {
      addHandler(node[pathSegment], verb, fullPath, handler);
    }

    node = node[pathSegment];
  }

  return this;
};

RouterLookup.prototype.matchRequestPath = function(fullPath, request) {
  // Look for matching path and return handler
  var node = this;
  var parts = getPathParts(fullPath);
  var pathSegment = '';

  for (var i = 0; i < parts.length; i++) {
    pathSegment = parts[i];
    if (!(pathSegment in node) && !node.param) return false;

    if (node.param) {
      pathSegment = Object.keys(node).filter(function(key) {
        if (key[0] === ':') {
          // place the path parameter in the request object
          request.params[key.split(':')[1]] = parts[i];
          return key;
        }
      }).pop();
      return node[pathSegment].methods;
    }

    if (i + 1 === parts.length) return node[pathSegment].methods;
    node = node[pathSegment];
  }
};

function getPathParts(path) {
  return path.trim().split('/').filter(Boolean);
};

/* NEEDS FIX */
// need to figure out a way to register multiple handlers
function addHandler(node, verb, fullPath, handler) {
  node.methods = node.methods || {};
  if (node.methods[verb]) {
    console.warn(
      'WARN: A handler was already registered for %s /api%s : Ignoring the new handler %s',
      verb.toUpperCase(),
      fullPath || '[unknown path]',
      handler.methodName || '<anonymous>'
      );
    return;
  }
  node.methods[verb] = handler;
};
// I think the fix will be creating a handler generator that calls multiple handler
// functions successively
/* END FIX */
