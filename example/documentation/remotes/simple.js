// This helper adds methods to a module that we assume will be added to the remotes.
var helper = require('../../../').extend(module.exports);

/**
 * Returns a secret message.
 */
helper.method(getSecret, { returns: 'string' });
function getSecret(callback) {
  callback(null, 'shhh!');
}

/**
 * Takes a string and returns an updated string.
 */
helper.method(transform, {
  accepts: [{ name: 'str', type: 'string' }],
  returns: 'string',
  description: 'Takes a string and returns an updated string.'
});
function transform(str, callback) {
  callback(null, 'transformed: ' + str);
}
