// define a method that can be called from node
// or over rest, or other from any strong-remoting client


// create a set of shared classes
var remotes = require('../').create();

// expose a simple object
var user = remotes.exports.user = {
  greet: function greet(person, fn) {
    if(fn.remoteContext) {
      fn(null, 'Greetings ' + person + '! I am talking to you remotely!');
    } else {
      fn(null, 'Hello ' + person + ', this is just a regular node function call... Nothing to see here.');
    }
  }
};

// share the greet method
user.greet.shared = true;
user.greet.accepts = {arg: 'person'};

// expose it over http
require('http')
  .createServer(remotes.handler('rest'))
  .listen(3000);
  
/*

Test the above with curl or a rest client:
  
  $ node simple.js
  $ curl http://localhost:3000/user/greet?person=joe

The function will log a different message when called below (from node):

*/
  
user.greet('mr. server', function (err, msg) {
  console.log(msg);
});