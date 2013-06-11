/**
 * The topmost Swagger resource is a description of all (non-Swagger) resources
 * available on the system, and where to find more information about them.
 */
function getResources(callback) {
  callback(null, {
    "apiVersion": "0.2",
    "swaggerVersion": "1.1",
    "basePath": "http://petstore.swagger.wordnik.com/api",
    "apis": [
      {
        "path": "/api-docs.{format}/user",
        "description": ""
      },
      {
        "path": "/api-docs.{format}/pet",
        "description": ""
      }
    ]
  });
}
getResources.shared = true;
getResources.accepts = [];
getResources.returns = [{ arg: 'data', type: 'object' }];

module.exports = {
  docs: getResources
};
