// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

var RemoteObjects = require('../../../');
var remotes = module.exports = RemoteObjects.create();

remotes.exports.User = require('./user');
