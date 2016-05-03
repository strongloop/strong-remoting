// Copyright IBM Corp. 2013,2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

// create a set of shared classes
var remotes = require('../').create();

// expose a simple object
var user = remotes.exports.user = {
  greet: function (fn) {
    fn(null, {msg: 'hello, world!'});
  }
};

// share the greet method
user.greet.shared = true;

// expose it over http
require('http')
  .createServer(remotes.handler('rest'))
  .listen(3000);
  
/*

Test the above with curl or a rest client:
  
  $ node simple.js
  $ curl http://localhost:3000/user/greet 
  {
    "msg": "hello, world!"
  }

*/