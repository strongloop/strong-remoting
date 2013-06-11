/**
 * Expose the `Swagger` plugin.
 */
module.exports = Swagger;

/**
 * Module dependencies.
 */
var Remoting = require('../');

/**
 * Create a remotable Swagger module for plugging into a SharedClassCollection.
 */
function Swagger(remotes) {
  // We need a temporary REST adapter to discover our available routes.
  var adapter = remotes.handler('rest').adapter;
  var routes = adapter.allRoutes();
  var extension = {};
  var helper = Remoting.extend(extension);
  var classes = remotes.classes();

  var resourceDoc = {
    apiVersion: '0.2', // TODO (optional)
    swaggerVersion: '1.1',
    basePath: 'http://localhost:3000', // TODO
    apis: []
  };

  var apiDocs = {};

  classes.forEach(function (item) {
    resourceDoc.apis.push({
      path: '/swagger/' + item.name, // TODO(schoon) - This will break if this
      // extension isn't installed at /swagger. Should the extension load itself
      // into the remotes directly? (YES, but take options for renaming /
      // avoiding collisions)
      description: item.ctor.sharedCtor && item.ctor.sharedCtor.description
    });

    console.log(item.name);

    apiDocs[item.name] = {
      apiVersion: resourceDoc.apiVersion,
      swaggerVersion: resourceDoc.swaggerVersion,
      basePath: resourceDoc.basePath,
      apis: []
    };

    helper.method(api, { path: item.name, returns: 'object' });

    function api(callback) {
      callback(null, apiDocs[item.name]);
    }
  });

  routes.forEach(function (route) {
    var split = route.method.split('.');
    var doc = apiDocs[split[0]];

    if (!doc) {
      console.error('No doc for %j', route);
      return;
    }

    doc.apis.push(routeToAPI(route));
  });

  console.log('Classes:');
  console.log(JSON.stringify(classes, null, 2));
  console.log('Routes:');
  console.log(JSON.stringify(routes, null, 2));

  /**
   * The topmost Swagger resource is a description of all (non-Swagger) resources
   * available on the system, and where to find more information about them.
   */
  helper.method(resources, { returns : 'object' });
  function resources(callback) {
    callback(null, resourceDoc);
  }

  return extension;
}

/**
 * Converts from an sl-remoting-formatted "Route" description to a
 * Swagger-formatted "API" description.
 */

function routeToAPI(route) {
  return {
    path: convertPathFragments(route.path),
    operations: [{
      httpMethod: (route.verb.toLowerCase() === 'all' ? 'POST' : route.verb.toUpperCase()),
      nickname: route.method,
      responseClass: prepareDataType(route.returns && route.returns[0].type),
      parameters: route.accepts ? route.accepts.map(acceptToParameter(route)) : [],
      errorResponses: [], // TODO(schoon) - We don't have descriptions for this yet.
      summary: route.description,
      notes: '' // TODO(schoon) - `description` metadata
    }]
  };
}

/**
 * Converts from an sl-remoting-formatted "Accepts" description to a
 * Swagger-formatted "Parameter" description.
 */

function acceptToParameter(route) {
  var type = 'form';

  if (route.verb.toLowerCase() === 'get') {
    type = 'query';
  }

  return function (accepts) {
    var name = accepts.name || accepts.arg;
    var paramType = type;

    // TODO: Regex?
    if (route.path.indexOf(':' + name) !== -1) {
      paramType = 'path';
    }

    return {
      paramType: paramType || type,
      name: name,
      description: accepts.description,
      dataType: prepareDataType(accepts.type),
      required: !!accepts.required,
      allowMultiple: false
    };
  };
}

/**
 * Converts from an sl-remoting data type to a Swagger dataType.
 */

function prepareDataType(type) {
  if (!type) {
    return 'void';
  }

  // TODO(schoon) - Add support for complex dataTypes.
  switch (type) {
    case 'buffer':
      return 'byte';
    case 'date':
      return 'Date';
    case 'number':
      return 'double';
  }

  return type;
}
