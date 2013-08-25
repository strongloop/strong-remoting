# strong-remoting

_Communicate between objects in servers, mobile apps, and other servers._

**Overview**

Communicating between objects that run in different processes, whether on the same computer, or in another programming language on a mobile device, is such a common application requirement that it should be simple. This library makes it easy to communicate accross these types of boundries without having to worry about the underlying transport mechanism. Once you determine your application's performance characteristics you can swap out the transport mechanism or build your own optimized transport for your app's specific needs.

## Install

```sh
$ npm install strong-remoting
```

## Quick Start

Setup a `strong-remoting` server.

```js
// create a collection of remote objects
var remotes = require('strong-remoting').create();

// export a `user` object
var user = remotes.exports.user = {
  greet: function (str, fn) {
    fn(null, str + ' world');
  }
};

// share the greet method
user.greet.shared = true;
user.greet.accepts = {arg: 'str'};
user.greet.returns = {arg: 'msg'};

// expose it over http
require('http')
  .createServer(remotes.handler('rest'))
  .listen(3000);
```

Invoke `user.greet()` over http.

```sh
$ curl http://localhost:3000/user/greet?str=hello
{
  "msg": "hello world"
}
```

## Concepts

### Remote Objects

Most node apps expose some sort of network available api. StrongRemoting allows you to build your app in regular JavaScript and export remote objects over the network the same way you export functions from a module. It also lets you swap out the underlying transport without changing any of your app specific code.

### Adapters

Adapters provide the transport specific mechanisms to allow remote clients to invoke methods on your remote objects. The rest adapter supports http and allows you to map your objects to RESTful resources. Other adapters provide a less opionated RPC style interface. Your application code doesn't need to know what adapter its using. You can always invoke methods on your remote objects locally in regular JavaScript. This is useful for testing or providing a node api that is also available over the network.

### Servers and Clients

**Servers**

**Node.js** is the only planned server environment. This may change in the future if there is demand for other implementations.

**Clients**

For higher level transports, such as REST and SocketIO, existing clients will work well. If you want to be able to swap out your transport, use one of our supported clients. The same adapter model on the server applies to clients, so you can switch transports on both the server and client without changing your app specific code.

 - [iOS](http://docs.strongloop.com/strong-remoting-clients#ios)
 - _Node.js_  **In Development** 
 - _HTML5_  **In Development**
 - _Java_  **In Development**
 
### Hooks

Hooks allow you to run code before objects are constructed or methods are invoked. Prevent actions based context (http request, user info, etc).

```js
// do something before greet
remotes.before('user.greet', function (ctx, next) {
  if((ctx.req.param('password') || '').toString() !== '1234') {
    next(new Error('bad password!'));
  } else {
    next();
  }
});

// do something before any user method
remotes.before('user.*', function (ctx, next) {
  console.log('calling a user method');
  next();
});

// do something before a dog instance method
remotes.before('dog.prototype.*', function (ctx, next) {
  var dog = this;
  console.log('calling a method on', dog.name);
  next();
});

// do something after the dog speak method
// note: you cannot cancel a method after
// it has been called
remotes.after('dog.prototype.speak', function (ctx, next) {
  console.log('after speak!');
  next();
});

// do something before all methods
remotes.before('**', function (ctx, next, method) {
  console.log('calling', method.name);
  next();
});

// modify all results
remotes.after('**', function (ctx, next) {
  ctx.result += '!!!';
  next();
});
```

[See the before-after example for more info](https://github.com/strongloop/strong-remoting/blob/master/example/before-after.js).

### Streams

StrongRemoting supports methods that expect or return `Readable` / `Writeable` streams. This allows you to stream raw binary data such as files over the network without writing a custom server.

```js
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
  pipe: {
    dest: 'res'
  }
};

// over rest / http
require('http')
  .createServer(remotes.handler('rest'))
  .listen(3000);
```

Invoke `fs.createReadStream()` using `curl`.

```sh
$ curl http://localhost:3000/fs/createReadStream?path=some-file.txt
```
