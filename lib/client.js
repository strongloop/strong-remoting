/**
 * Expose `Client`.
 */

module.exports = Client;

/**
 * Module dependencies.
 */
 
var EventEmitter = require('events').EventEmitter
  , debug = require('debug')('client')
  , util = require('util')
  , inherits = util.inherits
  , assert = require('assert');
  
/**
 * Create a new `Client` with the given `options`.
 *
 * @param {Object} options
 * @return {Client}
 */

function Client(options) {
  EventEmitter.apply(this, arguments);
  
  // throw an error if args are not supplied
  // assert(typeof options === 'object', 'Client requires an options object');
  
  this.options = options;
  
  debug('created with options', options);
}

/**
 * Inherit from `EventEmitter`.
 */

inherits(Client, EventEmitter);

/*!
 * Simplified APIs
 */

Client.create =
Client.createClient = function (options) {
  // add simplified construction / sugar here
  return new Client(options);
}



/**
 * A sample method. Add two numbers and return their sum.
 *
 * @param {Number} a
 * @param {Number} b
 * @return {Number}
 */
 
Client.prototype.myMethod = function (a, b) {
  throw new Error('not implemented');
}