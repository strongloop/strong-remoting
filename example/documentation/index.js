var http = require('http');
var remotes = require('./remotes');
var meta = require('../../ext/meta');
var swagger = require('../../ext/swagger');
var port = process.argv[2] || 3000;
var handler;
var adapter;

// The installation order sets which routes are captured by Swagger.
remotes.exports.swagger = swagger(remotes);
remotes.exports.meta = meta(remotes);

http
  .createServer(remotes.handler('rest'))
  .listen(port, function (err) {
    if (err) {
      console.error('Failed to start server with: %s', err.stack || err.message || err);
      process.exit(1);
    }

    console.log('Listening on port %s...', port);
  });
