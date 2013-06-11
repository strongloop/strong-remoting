var helper = require('../../../').extend(module.exports);

/**
 * Returns a secret message.
 */
helper.method(getSecret, {
  http: { verb: 'GET', path: '/customizedGetSecret' },
  returns: 'string'
});
function getSecret(callback) {
  callback(null, 'shhh!');
}

/**
 * Takes a string and returns an updated string.
 */
helper.method(transform, {
  http: { verb: 'PUT', path: '/customizedTransform' },
  accepts: [{ arg: 'str', type: 'string', required: true }],
  returns: 'string'
});
function transform(str, callback) {
  callback(null, 'transformed: ' + str);
}
