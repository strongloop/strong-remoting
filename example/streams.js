// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

// faux remote stream
var destination = process.stdout;
var fs = require('fs');
var path = require('path');

// create a set of shared classes
var remotes = require('../').create();

// our modules
var fileService = remotes.exports.files = {
  upload: function() {
    return destination;
  },
  download: function() {
    return fs.createReadStream(path.join(__dirname, 'streams.js'));
  },
};

fileService.upload.http = {
  // pipe to the request
  // to the result of the function
  pipe: {
    source: 'req',
  },
};
fileService.upload.shared = true;

fileService.download.http = {
  // pipe to the response
  // for the http transport
  pipe: {
    dest: 'res',
  },
};
fileService.download.shared = true;

// over rest / http
require('http')
  .createServer(remotes.handler('rest'))
  .listen(3000);
