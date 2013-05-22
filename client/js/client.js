
module.exports = RemoteObjects;

function RemoteObjects(url, adapter, contract) {
  this.url = url;
  this.adapter = adapter;
  this.contract = contract || {};
}

RemoteObjects.prototype.construct = function (name) {
  return new RemoteObject(Array.prototype.slice.call(arguments, 0), this);
}

RemoteObjects.prototype.createRequest = function (methodString, ctorArgs, args, fn) {
  this.adapter.createRequest.apply(this.adapter, arguments);
}

RemoteObjects.prototype.invoke = function (methodString, ctorArgs, args, fn) {
  if(typeof ctorArgs === 'function') {
    fn = ctorArgs;
    ctorArgs = args = undefined;
  }
  
  if(typeof args === 'function') {
    fn = args;
    args = ctorArgs;
    ctorArgs = undefined;
  }
  
  this.createRequest(methodString, ctorArgs, args, fn);
}

// END REST ADAPTER IMPL.

RemoteObjects.connect = function (url, Adapter, contract) {
  var adapter = new Adapter();
  
  adapter.connect(url);
  
  return new RemoteObjects(url, adapter, contract);
}

function RemoteObject(args, remotes) {
  // remove name
  this.name = args.shift();
  
  // save args
  this.ctorArgs = args;
  
  // all remote objects
  this.remotes = remotes;
}

RemoteObject.prototype.invoke = function (method, args, fn) {
  if(typeof args === 'function') {
    fn = args;
    args = undefined;
  }
  
  this.remotes.invoke(this.name + '.prototype.' + method, this.ctorArgs, args, fn);
}
