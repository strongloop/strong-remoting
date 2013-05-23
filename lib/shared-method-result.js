/**
 * Expose `SharedMethodResult`.
 */

module.exports = SharedMethodResult;

/**
 * Module dependencies.
 */
 
var EventEmitter = require('events').EventEmitter
  , debug = require('debug')('shared-method')
  , util = require('util')
  , inherits = util.inherits
  , assert = require('assert');
  
/**
 * Create a new `SharedMethodResult` with the given `fn`.
 *
 * @param {Object} data
 * @return {SharedMethodResult}
 */

function SharedMethodResult(data, method) {
  this.raw = data;
}

SharedMethodResult.prototype.getType = function (val) {
  var type = typeof val;
  
  switch(type) {
    case 'undefined':
    case 'boolean':
    case 'number':
    case 'function':
    case 'string':
      return type;
    break;
    case 'object':
      // null
      if(val === null) {
        return 'null';
      }
      
      // buffer
      if(Buffer.isBuffer(val)) {
        return 'buffer';
      }
      
      // array
      if(Array.isArray(val)) {
        return 'array';
      }
      
      // date
      if(val instanceof Date) {
        return 'date';
      }
      
      // object
      return 'object';
    break;
  }
}

/**
 * Determine if the raw data is a given type.
 * 
 * Supported Values:
 *
 *   **simple**
 *   undefined
 *   boolean
 *   number
 *   string
 *   array
 *   object
 *   **complex**
 *   date
 *   buffer
 *
 */

SharedMethodResult.prototype.is = function(type) {
  return this.type === type;
}

SharedMethodResult.prototype.toJSON = function(raw) {
  var result = {};
  raw = raw || this.raw;
  
  switch(this.getType(raw)) {
    case 'undefined':
      // return undefined
      return;
    break;
    case 'boolean':
    case 'number':
    case 'string':
      result.data = raw;
    break;
    case 'array':
      result = raw;
    break;
    case 'object':
      // convert entire object
      Object.keys(raw).forEach(function (key) {
        raw[key] = this.toJSON(raw[key]);
      }.bind(this));
      
      result = raw;
    break;
    case 'date':
      result.data = raw.toString();
      result.type = 'date';
    break;
    case 'buffer':
      result.data = raw.toString('base64');
      result.type = 'base64';
    break;
  }
  
  return result;
}