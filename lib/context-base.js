'use strict';

var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;

module.exports = ContextBase;

/**
 * A base class for all Context instances
 */
function ContextBase(method) {
  EventEmitter.call(this);

  this.method = method;
}

inherits(ContextBase, EventEmitter);

ContextBase.prototype.getScope = function() {
  // Static methods are invoked on the constructor (this = constructor fn)
  // Prototype methods are invoked on the instance (this = instance)
  var method = this.method;

  // if the resolveScope function exists, the method is a controller method
  // and the scope must be resolved
  if (method.sharedClass && method.sharedClass.resolveScope)
    return method.sharedClass.resolveScope(this);

  return this.instance ||
    method.ctor ||
    method.sharedMethod && method.sharedMethod.ctor;
};
