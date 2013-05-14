// create a set of shared classes
var remotes = require('../').create();

// expose a simple object
var user = remotes.exports.user = {
  greet: function (fn) {
    fn(null, 'hello, world!');
  }
};

// share the greet method
user.greet.shared = true;

// do something before greet
remotes.before(user.greet, function (ctx, next) {
  if(ctx.req.param('password') !== '1234') {
    next(new Error('bad password!'));
  } else {
    next();
  }
});

// expose it over http
require('http')
  .createServer(remotes.handler('rest'))
  .listen(3000);
  
/*

Test the above with curl or a rest client:
  
  $ node simple.js
  $ curl http://localhost:3000/user/greet 
  bad password! 
  $ curl http://localhost:3000/user/greet?password=1234
  hello, world!
*/