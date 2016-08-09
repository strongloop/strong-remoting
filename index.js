// Copyright IBM Corp. 2013,2014. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

/**
 * remotes ~ public api
 */

var SG = require('strong-globalize');
SG.SetRootDir(__dirname);

module.exports = require('./lib/remote-objects');
module.exports.SharedClass = require('./lib/shared-class');
