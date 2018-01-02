// Copyright IBM Corp. 2013,2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var helper = require('../../../').extend(module.exports);

/**
 * Returns a secret message.
 */
helper.method(getSecret, {
  http: {verb: 'GET', path: '/customizedGetSecret'},
  returns: {name: 'secret', type: 'string'},
});
function getSecret(callback) {
  callback(null, 'shhh!');
}

/**
 * Takes a string and returns an updated string.
 */
helper.method(transform, {
  http: {verb: 'PUT', path: '/customizedTransform'},
  accepts: [{name: 'str', type: 'string', required: true}],
  returns: {name: 'str', type: 'string'},
});
function transform(str, callback) {
  callback(null, 'transformed: ' + str);
}
