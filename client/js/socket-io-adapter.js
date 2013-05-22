module.exports = SocketIOAdapter;


function SocketIOAdapter() {
  this.callbacks = {};
}

SocketIOAdapter.prototype.connect = function (url) {
  var socket = this.socket = require('socket.io-client')(url);
  var self = this;
  
  socket.on('result', self.findAndExecCallback.bind(this));
}

SocketIOAdapter.prototype.createRequest = function (methodString, ctorArgs, args, fn) {
  var id = this.createCallback(methodString, fn);
  this.socket.emit('invoke', methodString, ctorArgs, args, id);
}

SocketIOAdapter.prototype.findAndExecCallback = function (result) {
  var callback = this.callbacks[result.methodString + '-' + result.id];
  
  callback(result.err, this.resultToData(result));
}

SocketIOAdapter.prototype.createCallback = function (methodString, fn) {
  var id = Math.floor(Math.random() * 1024 + 1);
  this.callbacks[methodString + '-' + id] = fn;
  return id;
}

SocketIOAdapter.prototype.resultToData = function (result) {
  if(Array.isArray(result.__types__)) {
    if(result.__types__.length === 1) {
      result.data = cast(result.data, result.__types__[0].type)
    } else {
      result.__types__.forEach(function (t) {
        result.data[t.arg] = cast(result.data[t.arg], t.type);
      });
    }
  }
  
  return result.data;
  
  function cast(val, type) {
    switch(type) {
      case 'buffer':
        return new Buffer(val);
      break;
    }
    
    return val;
  }
}