// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

// this server should be started before running tests in the e2e directory
var path = require('path');
var FIXTURES = path.join(__dirname, 'fixtures');
var remotes = require(path.join(FIXTURES, 'remotes'));

require('http')
  .createServer(remotes.handler('rest'))
  .listen(3000, function() {
    console.log('e2e server listening...');
  });
