'use strict';
// Copyright IBM Corp. 2013,2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

// create a set of shared classes
var remoting = require('../../');
var SharedClass = remoting.SharedClass;
var remotes = require('../../').create();

var user = {
  prototype: {
    greet: function(name, fn) {
      fn(null, 'hello ' + name);
    },
  },
};

// expose a simple object
// create a shared class to allow strong-remoting to map
// http requests to method invocations on your class
var userSharedClass = new SharedClass('user', user);

// tell strong-remoting about your greet method
userSharedClass.defineMethod('greet', {
  isStatic: false, // not an instance method
  accepts: [
    {arg: 'name', type: 'string'},
  ],
  returns: [{
    arg: 'msg',
    type: 'string', // define the type of the callback arguments
  }],
});

remotes.before('user.prototype.greet', function(ctx, next) {
  ctx.authId = 'value';
  next();
});

remotes.after('user.prototype.greet', function(ctx, next) {
  console.log('after user.greet:', ctx.authId);
  next();
});

// tell strong-remoting about the class
remotes.addClass(userSharedClass);

// expose it over http
var server =
    require('http')
        .createServer()
        .listen(9000);

remotes.handler('primus', server);
