/**
 * Expose `SharedClassCollection`.
 */

module.exports = SharedClassCollection;

/**
 * Module dependencies.
 */
 
var EventEmitter = require('events').EventEmitter
  , debug = require('debug')('remotes')
  , util = require('util')
  , inherits = util.inherits
  , assert = require('assert')
  , SharedClass = require('./shared-class');
  
/**
 * Create a new `SharedClassCollection` with the given `options`.
 *
 * @param {Object} options
 * @return {SharedClassCollection}
 */

function SharedClassCollection(options) {
  EventEmitter.apply(this, arguments);
  this.options = options || {};
  this.exports = this.options.exports || {};
}

/**
 * Inherit from `EventEmitter`.
 */

inherits(SharedClassCollection, EventEmitter);

/*!
 * Simplified APIs
 */

SharedClassCollection.create = function (options) {
  return new SharedClassCollection(options);
}

/**
 * Create a handler from the given adapter.
 *
 * @param {String} adapter name
 * @return {Function}
 */
 
SharedClassCollection.prototype.handler = function (name) {
  var Adapter = this.adapter(name);
  var adapter = new Adapter(this);
  
  return adapter.createHandler();
}

/**
 * Get an adapter by name.
 * @param {String} adapter name
 * @return {Adapter}
 */

SharedClassCollection.prototype.adapter = function (name) {
  return require('./' + name + '-adapter');
}

/**
 * Get all classes.
 */

SharedClassCollection.prototype.classes = function () {
  var exports = this.exports;
  
  return Object
    .keys(exports)
    .map(function (name) {
      return new SharedClass(name, exports[name]);
    });
}

/**
 * Get all methods.
 */

SharedClassCollection.prototype.methods = function () {
  var methods = [];
  
  this
    .classes()
    .forEach(function (sc) {
      methods = sc.methods().concat(methods);
    });
    
  return methods;
}