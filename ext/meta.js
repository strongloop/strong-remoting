/**
 * Expose the `Meta` plugin.
 */
module.exports = Meta;

/**
 * Module dependencies.
 */
var Remoting = require('../');

/**
 * Create a remotable Meta module for plugging into a SharedClassCollection.
 */
function Meta(remotes) {
  // We need a temporary REST adapter to discover our available routes.
  var adapter = remotes.handler('rest').adapter;
  var extension = {};
  var helper = Remoting.extend(extension);

  helper.method(routes, { returns: 'object' });
  function routes(callback) {
    callback(null, adapter.allRoutes());
  }

  helper.method(classes, { returns: 'object' });
  function classes(callback) {
    callback(null, remotes.classes());
  }

  return extension;
}
