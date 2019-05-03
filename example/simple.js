// Copyright IBM Corp. 2013,2017. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

// create a set of shared classes
var remoting = require('../');
var SharedClass = remoting.SharedClass;
var remotes = remoting.create();
var express = require('express');
var app = express();

// define a class-like object (or constructor)
var user = {
  greet: function(fn) {
    fn(null, 'hello, world!');
  },
};

// create a shared class to allow strong-remoting to map
// http requests to method invocations on your class
var userSharedClass = new SharedClass('user', user);

// tell strong-remoting about your greet method
userSharedClass.defineMethod('greet', {
  isStatic: true, // not an instance method
  returns: [{
    arg: 'msg',
    type: 'string', // define the type of the callback arguments
  }],
});

// tell strong-remoting about the class
remotes.addClass(userSharedClass);

// mount the middleware on an express app
app.use(remotes.handler('rest'));

// create the http server
require('http')
  .createServer(app)
  .listen(3000);

/*

Test the above with curl or a rest client:

  $ node simple.js
  $ curl http://localhost:3000/user/greet
  # responds as an object, with the msg attribute
  # set to the result of the function
  {
    "msg": "hello, world!"
  }

*/
