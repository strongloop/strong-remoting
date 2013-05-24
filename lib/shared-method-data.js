/**
 * Expose `SharedMethodData`.
 */

module.exports = SharedMethodData;

/**
 * Module dependencies.
 */
 
var EventEmitter = require('events').EventEmitter
  , debug = require('debug')('shared-method')
  , util = require('util')
  , inherits = util.inherits
  , assert = require('assert');
  
/**
 * Create a new `SharedMethodData` with the given `fn`.
 *
 * @param {Object} data
 * @return {SharedMethodData}
 */

function SharedMethodData(data, method) {
  this.raw = data;
}

SharedMethodData.prototype.getType = function (val) {
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

SharedMethodData.prototype.is = function(type) {
  return this.type === type;
}

SharedMethodData.prototype.toArgs = function(raw, argName) {
  raw = raw || this.raw;
  var result = raw.data || raw;
  
  var type = raw.type;
  
  switch(type) {
    case 'base64':
      result = new Buffer(result, 'base64');
    break;
    case 'date':
      result = new Date(result);
    break;
    default:
      switch(this.getType(result)) {
        case 'array':
          // TODO scrub arrays
        break;
        case 'object':
          // convert entire object
          Object.keys(result).forEach(function (key) {
            if(result[key]) {
              result[key] = this.toArgs(result[key]);
            }
          }.bind(this));
        break;
      }
    break;
  }
  
  return result;
}

SharedMethodData.prototype.toResult = function(raw, isChild) {
  var result = {};
  var isRoot = !isChild;
  
  if(typeof raw === 'undefined') {
    raw = this.raw;
  }
  
  switch(this.getType(raw)) {
    case 'null':
      result.type = 'null';
    break;
    case 'undefined':
      // return undefined
      return;
    break;
    case 'boolean':
    case 'number':
    case 'string':
      if(isRoot) {
        result.data = raw;
      } else {
        result = raw;
      }
    break;
    case 'array':
      // TODO scrub arrays
      result = raw;
    break;
    case 'object':
      // convert entire object
      Object.keys(raw).forEach(function (key) {
        if(raw[key]) {
          raw[key] = this.toResult(raw[key], true);
        }
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