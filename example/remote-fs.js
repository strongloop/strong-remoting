// create a set of shared classes
var remotes = require('../').create();

// share some fs module code
var fs = remotes.exports.fs = require('fs');

// specifically the readFile function
fs.readFile.shared = true;

// describe the arguments
fs.readFile.accepts = {arg: 'path', type: 'string'};

// over rest / http
require('http')
  .createServer(remotes.handler('rest'))
  .listen(3000);
  
/*

Test the above with curl or a rest client:

  $ node simple.js
  $ curl http://localhost:3000/fs/readFile?path=simple.js

*/