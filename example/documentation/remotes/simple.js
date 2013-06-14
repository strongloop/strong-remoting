// This helper adds methods to a module that we assume will be added to the remotes.
var helper = require('../../../').extend(module.exports);

/**
 * Returns a secret message.
 */
helper.method(getSecret, {
  returns: { name: 'secret', type: 'string' }
});
function getSecret(callback) {
  callback(null, 'shhh!');
}

/**
 * Takes a string and returns an updated string.
 */
helper.method(transform, {
  accepts: [{ name: 'str', type: 'string', required: true, description: 'The value to update' }],
  returns: { name: 'str', type: 'string' },
  description: 'Takes a string and returns an updated string.'
});
function transform(str, callback) {
  callback(null, 'transformed: ' + str);
}
