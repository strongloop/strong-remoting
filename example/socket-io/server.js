// Copyright IBM Corp. 2013,2017. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

// create a set of shared classes
const remotes = require('../../').create();

// share some fs module code
const fs = remotes.exports.fs = require('fs');

// specifically the readFile function
fs.readFile.shared = true;

// describe the arguments
fs.readFile.accepts = {arg: 'path', type: 'string'};

// describe the result
fs.readFile.returns = {arg: 'data', type: 'buffer'};

// event emitter
const EventEmitter = require('events').EventEmitter;
const ee = remotes.exports.ee = new EventEmitter();

// expose the on method
ee.on.shared = true;
ee.on.accepts = {arg: 'event', type: 'string'};
ee.on.returns = {arg: 'data', type: 'object'};

setInterval(function() {
  // emit some data
  ee.emit('foo', {some: 'data'});
}, 1000);

// expose it over http
const server =
require('http')
  .createServer()
  .listen(3000);

remotes.handler('socket-io', server);
