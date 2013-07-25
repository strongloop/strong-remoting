# strong-remoting

Communicate between objects in servers, mobile apps, and other servers.

## Background

Communicating between objects that run in different processes, whether on the same computer, or in another programming language on a mobile device, is such a common application requirement that it should be simple. This library makes it easy to communicate accross these types of boundries without having to worry about the underlying transport mechanism. Once you determine your application's performance characteristics you can swap out the transport mechanism or build your own optimized transport for your app's specific needs.

### Supported Servers

 - **Node.js** - the only planned server.

### Supported Clients

 - **Node.js**  **TODO** 
 - **HTML5**  **TODO**
 - **iOS**  **TODO**
 - **Android**  **TODO**
 
### Features

#### Security and Encryption _TODO_

All transports are runnable over secure channels (eg. TLS). All transports support authentication.

#### Remote Objects

Construct objects on the server from a connected client.

#### Remote Methods

Invoke methods on remote objects.

#### Data Types

**JSON**

 - Number
 - Boolean
 - String
 - Array
 - Object

**Complex Types**

 - Date
 - Buffer
 - ReadableStream **TODO**
 - WriteableStream **TODO**
 - EventEmitter **TODO**
 
#### Hooks

Run code before objects are constructed or methods are invoked. Prevent actions based context (http request, user info, etc).

#### Binary Data **TODO**

Send and recieve raw binary data such as files as a single `Buffer` or `Readable` / `Writeable` streams.

#### Events **TODO**

Reference event emitters from clients and listen to their events.

#### Supported Transports

 - **socket.io TODO**
 - **http**
 
#### Content Types

 - **JSON** - only planned type
 
## Basic Usage

### Creating a Server

    // create a set of shared classes
    var remoteObjects = require('strong-remoting').create();

    // expose the console
    remoteObjects.exports.console = console;

    // share the log method
    console.log.shared = true;

    // expose it over http
    require('http')
      .createServer(remotes.handler('http'))
      .listen(3000);
      
### Creating a Client (JavaScript)

    // connect to the server
    var remoteObjects = Remoting.connect('http://localhost:3000', Remoting.adapters.http));
    
    // log hello world from the client
    remoteObjects.invoke('console.log', 'hello world');
    
### Server Side Hooks
    
    // prevent non localhost requests
    remoteObjects.before('console.log', function(ctx, next) {
      if(ctx.req.remoteAddress !== '127.0.0.1') {
        next(new Error('you are not allowed!'));
      } else {
        next();
      }
    });
    
    // run after console.log but before the response is sent
    remoteObjects.after('console.log', function(ctx, next) {
      // change the result
      ctx.result = 'updated result...';
      next();
    });

### Events _TODO_

Listen to events on server side emitters from a client.

    // server
    var myEmitter = remoteObjects.exports.myEmitter = new EventEmitter();
    
    setInterval(function() {
      myEmitter.emit('my event', {foo: 'bar'});
    }, 1000);
    
    // expose the on method
    myEmitter.on.shared = true;

    // client
    remoteObjects.invoke('myEmitter.on', 'my event', function (data) {
      console.log('this will be called multiple times...', data);
    });
