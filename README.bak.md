# remotes
v0.0.1

A library for sharing server side JavaScript classes over various transports and protocols to clients written in various languages.

## Usage

Define a shared class in JavaScript on the server. Give it a remote constructor. Mark which methods should be exposed and define their input and outut types.

## Shared Classes

A class defined on the server that can be used on the client. Only exposes methods that are marked to be exposed. Requires a remote constructor that creates an instance of the class when constructed remotely.

**Example ~ Server**

    function Dog(name) {
      this.name = name;
    }
    Dog.sharedCtor = function (name, fn) {
      fn(null, new MyClass(name));
    }
    Dog.remoteConstructor.accepts = [
      {arg: 'name', type: 'string'}
    ];

    Dog.prototype.speak = function (fn) {
      fn(null, 'roof! my name is ' + this.name);
    }
    Dog.prototype.speak.shared = true;
    Dog.prototype.speak.returns = [
      {arg: 'sound', type: 'string'}
    ];

## Source Generators

Once a class is defined, a source generator may be used to generate client source code.

**Example ~ Generated JS Client**

    Remotes.Dog = function Dog(name) {
      Remotes.Base.apply(this, arguments);
    }

    Dog.prototype.speak = function (fn) {
      this.callRemote('speak', fn);
    }

## Servers / Transports

Servers expose classes over one or more transports.

**Example ~ Server / Transport Usage**

    // a set of shared classes
    var remotes = require('remotes').create();
    
    // expose classes
    remotes.exports.dog = Dog;
    
    // server
    require('http')
      .createServer(remotes.handler('rest'))
      .listen(3000);

## Clients

Clients point to a server and call methods.

**Example ~ Client Usage**

    // a set of shared classes
    var remotes = require('remotes').create();
  
    remotes.client('rest').connect(3000);
    var Dog = Remotes.Dog;
    
    var dog = new Dog('fido');

    dog.speak(function (err, result) {
      console.log(result); // roof! my name is fido
    });


## Docs

### Method Settings

** General Settings **

Mark a method as shared / exposed / remotable:

    MyClass.prototype.myMethod.shared = true;

** HTTP Settings **

Override the default http routing.

    // define a new base route for the entire class
    MyClass.http = [
      {path: '/:foo'} // `foo` can be used as an arg
    ];
    
    // routes are relative to class namespace
    MyClass.prototype.myMethod.http = [
      {verb: 'POST', path: '/foo/:bar'}, // special route
      {verb: 'PUT'} // uses default route
    ];