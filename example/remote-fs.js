// Copyright IBM Corp. 2013,2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

// create a set of shared classes
var remotes = require('../').create();

// share some fs module code
var fs = remotes.exports.fs = require('fs');

// specifically the createReadStream function
fs.createReadStream.shared = true;

// describe the arguments
fs.createReadStream.accepts = {arg: 'path', type: 'string'};

// describe the stream destination
fs.createReadStream.http = {
  // pipe to the response
  // for the http transport
  pipe: {
    dest: 'res',
  },
};

// over rest / http
require('http')
  .createServer(remotes.handler('rest'))
  .listen(3000);

/*

Test the above with curl or a rest client:

  $ node remote-fs.js
  $ curl http://localhost:3000/fs/createReadStream?path=simple.js

*/
