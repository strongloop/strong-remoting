// Copyright IBM Corp. 2013,2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var g = require('strong-globalize')();

var Remotes = require('../../client/js/client');
var SocketIOAdapter = require('../../client/js/socket-io-adapter');
var remotes = Remotes.connect('http://localhost:3000', SocketIOAdapter);

remotes.invoke('fs.readFile', {path: 'test.txt'}, function(err, data) {
  g.log(data.toString());
});

remotes.invoke('ee.on', {event: 'foo'}, function(err, data) {
  g.log('foo event ran! %s', data); // logged multiple times
});
