// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

const assert = require('assert');
const EventEmitter = require('events').EventEmitter;
const TypeRegistry = require('./type-registry');
const inherits = require('util').inherits;

module.exports = ContextBase;

/**
 * A base class for all Context instances
 */
function ContextBase(method, typeRegistry) {
  // NOTE(bajtos) we are not asserting via "instanceof" to allow
  // multiple copies of strong-remoting to cooperate together
  assert(method && typeof method === 'object',
    'method must be a SharedClass instance');
  assert(typeRegistry && typeof typeRegistry === 'object',
    'typeRegistry must be a TypeRegistry instance');

  EventEmitter.call(this);

  this.method = method;
  this.typeRegistry = typeRegistry;
}

inherits(ContextBase, EventEmitter);

ContextBase.prototype.getScope = function() {
  // Static methods are invoked on the constructor (this = constructor fn)
  // Prototype methods are invoked on the instance (this = instance)
  const method = this.method;
  return this.instance ||
    method.ctor ||
    method.sharedMethod && method.sharedMethod.ctor;
};

ContextBase.prototype.setReturnArgByName = function(name, value) {
  // no-op
};
