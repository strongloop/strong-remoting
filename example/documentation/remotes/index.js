// Copyright IBM Corp. 2013,2017. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var remotes = require('../../../').create();

/**
 * Example API
 */
remotes.exports.simple = require('./simple');
remotes.exports.contract = require('./contract');
remotes.exports.SimpleClass = require('./simple-class').SimpleClass;
remotes.exports.ContractClass = require('./contract-class').ContractClass;

module.exports = remotes;
