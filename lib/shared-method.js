/**
 * Expose `SharedMethod`.
 */

module.exports = SharedMethod;

/**
 * Module dependencies.
 */
 
var EventEmitter = require('events').EventEmitter
  , debug = require('debug')('shared-method')
  , util = require('util')
  , inherits = util.inherits
  , assert = require('assert')
  , SharedMethodData = require('./shared-method-data')
  
/**
 * Create a new `SharedMethod` with the given `fn`.
 *
 * @param {Function} fn
 * @return {SharedMethod}
 */

function SharedMethod(fn, name, sc, isStatic) {
  assert(fn);
  this.fn = fn;
  this.name = name;
  this.isStatic = isStatic;
  this.accepts = fn.accepts || [];
  this.returns = fn.returns || [];
  this.sharedClass = sc;
  if(sc) {
    this.ctor = sc.ctor;
    this.sharedCtor = sc.sharedCtor;
  }
  if(name === 'sharedCtor') {
    this.isSharedCtor = true;
  }
  
  if(this.accepts && !Array.isArray(this.accepts)) {
    this.accepts = [this.accepts];
  }
  if(this.returns && !Array.isArray(this.returns)) {
    this.returns = [this.returns];
  }
  
  this.stringName = (sc ? sc.name : '') + (isStatic ? '.' : '.prototype.') + name;
}

/**
 * Execute the remote method using the given arg data.
 * 
 * @param args {Object} containing named argument data
 * @param fn {Function} callback `fn(err, result)` containing named result data
 */

SharedMethod.prototype.invoke = function (scope, args, fn) {
  var accepts = this.accepts;
  var returns = this.returns;
  var method = this.fn;
  var sharedMethod = this;
  var formattedArgs = [];
  var result;
  
  var argsData = new SharedMethodData(args, this);
  
  // convert complex types from json
  args = argsData.toArgs();
  
  // map the given arg data in order they are expected in
  if(accepts) {
    accepts.forEach(function (desc) {
      var uarg = args[desc.arg];
      
      // TODO validate type
      // TODO validate required
      // etc
      var actualType = argsData.getType(uarg);
      
      // is the arg optional?
      // arg was not provided
      if(actualType === 'undefined') {
        if(desc.required) {
          throw new Error(desc.arg + ' is a required arg');
        } else {
          return;
        }
      }
      
      if(actualType !== desc.type) {
        if(actualType === 'string') {
          switch(desc.type) {
            case 'number':
              uarg = Number(uarg);
            break;
            case 'boolean':
              uarg = Boolean(uarg);
            break;
            case 'object':
            case 'array':
              uarg = JSON.parse(uarg);
            break;
          }
        }
        

      }
      
      if(actualType !== 'undefined') formattedArgs.push(uarg);
    });
  }
  
  // add in the required callback
  formattedArgs.push(function (err) {
    if(err) {
       return fn(err);
     }

     var resultArgs = arguments;

     // map the arguments using the returns description
     if(returns.length > 1) {
       // multiple
       result = {};

       returns.forEach(function (o, i) {
         // map the name of the arg in the returns desc
         // to the same arg in the callback
         result[o.arg] = resultArgs[i + 1];
       });
     } else {
       // single or no result...
       result = resultArgs[1];
     }
  
     debug('- %s - result %j', sharedMethod.name, result);
     
     fn(null, new SharedMethodData(result, sharedMethod).toResult());
  });
  
  debug('- %s - invoke with %j', this.name, formattedArgs);
  
  // invoke
  method.apply(scope, formattedArgs);
}