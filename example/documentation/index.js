// Copyright IBM Corp. 2013,2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

var http = require('http');
var remotes = require('./remotes');
var meta = require('../../ext/meta');
var swagger = require('../../ext/swagger');
var port = process.argv[2] || 3000;
var handler;
var adapter;

// The installation order sets which routes are captured by Swagger.
swagger(remotes, {
  basePath: 'http://localhost:3000'
});
meta(remotes);

http
  .createServer(remotes.handler('rest'))
  .listen(port, function (err) {
    if (err) {
      console.error('Failed to start server with: %s', err.stack || err.message || err);
      process.exit(1);
    }

    console.log('Listening on port %s...', port);
  });
