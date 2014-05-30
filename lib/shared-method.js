/**
 * Expose `SharedMethod`.
 */

module.exports = SharedMethod;

/**
 * Module dependencies.
 */

var debug = require('debug')('strong-remoting:shared-method')
  , assert = require('assert')
  , traverse = require('traverse');

/**
 * Create a new `SharedMethod` with the given `fn`.
 *
 * @param {Function} fn
 * @param {Function} name
 * @param {SharedClass} SharedClass
 * @param {Boolean} isStatic
 */

function SharedMethod(fn, name, sc, options) {
  if (typeof options === 'boolean') {
    options = { isStatic: options };
  }
  
  this.fn = fn;
  fn = fn || {};
  options = options || {};
  this.name = options.alias || options.operationName || fn.alias || fn.operationName || name;
  var isStatic = this.isStatic = options.isStatic;
  this.accepts = options.accepts || fn.accepts || [];
  this.returns = options.returns || fn.returns || [];
  this.description = options.description || fn.description;
  this.http = options.http || fn.http || {};
  this.rest = options.rest || fn.rest || {};
  this.shared = options.shared;
  if(this.shared === undefined) {
    this.shared = true;
  }
  if(fn.shared === false) {
    this.shared = false;
  }
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

  this.methodName = (sc ? sc.name : '') + (isStatic ? '.' : '.prototype.') + name;
  this.operationName = (sc ? sc.name : '') + (isStatic ? '.' : '.prototype.') + this.name;
}

/**
 * Create a new `SharedMethod` with the given `fn`. The function should include
 * all the method options.
 *
 * @param {Function} fn
 * @param {Function} name
 * @param {SharedClass} SharedClass
 * @param {Boolean} isStatic
 */

SharedMethod.fromFunction = function(fn, name, sharedClass, isStatic) {
  return new SharedMethod(fn, name, sharedClass, {
    isStatic: isStatic,
    accepts: fn.accepts,
    returns: fn.returns,
    description: fn.description,
    http: fn.http,
    rest: fn.rest
  });
}

/*
 * Check the method has a matching name
 * @param {String} name The name
 * @returns {boolean} true if method name or operation name matches
 */
SharedMethod.prototype.hasName = function(name) {
  return this.methodName === name || this.operationName === name;
};

/**
 * Execute the remote method using the given arg data.
 *
 * @param args {Object} containing named argument data
 * @param fn {Function} callback `fn(err, result)` containing named result data
 */

SharedMethod.prototype.invoke = function (scope, args, fn) {
  var accepts = this.accepts;
  var returns = this.returns;
  var method = this.getFunction();
  var sharedMethod = this;
  var formattedArgs = [];
  var result;

  // map the given arg data in order they are expected in
  if(accepts) {
    for(var i = 0; i < accepts.length; i++) {
      var desc = accepts[i];
      var name = desc.name || desc.arg;
      var uarg = SharedMethod.convertArg(desc, args[name]);
      var actualType = SharedMethod.getType(uarg);

      // is the arg optional?
      // arg was not provided
      if(actualType === 'undefined') {
        if(desc.required) {
          var err = new Error(name + ' is a required arg');
          err.statusCode = 400;
          return fn(err);
        } else {
          // Add the argument even if it's undefined to stick with the accepts
          formattedArgs.push(undefined);
          continue;
        }
      }

      // convert strings
      if(actualType === 'string' && desc.type !== 'any' && actualType !== desc.type) {
        switch(desc.type) {
          case 'number':
            uarg = Number(uarg);
          break;
          case 'boolean':
            uarg = Boolean(uarg);
          break;
          case 'object':
          case 'array':
            try {
              uarg = JSON.parse(uarg);
            } catch(err) {
              debug('- %s - invalid value for argument \'%s\' of type \'%s\': %s',
                sharedMethod.name, name, desc.type, uarg);
              return fn(err);
            }
          break;
        }
      }

      // Add the argument even if it's undefined to stick with the accepts
      formattedArgs.push(uarg);
    }
  }

  // define the callback
  function callback(err) {
    if(err) {
      return fn(err);
    }

    result = SharedMethod.toResult(returns, [].slice.call(arguments, 1));

    debug('- %s - result %j', sharedMethod.name, result);

    fn(null, result);
  }

  // add in the required callback
  formattedArgs.push(callback);

  debug('- %s - invoke with', this.name, formattedArgs);

  // invoke
  return method.apply(scope, formattedArgs);
}

/**
 * Returns an appropriate type based on `val`.
 */

SharedMethod.getType = function (val) {
  var type = typeof val;

  switch (type) {
    case 'undefined':
    case 'boolean':
    case 'number':
    case 'function':
    case 'string':
      return type;
    case 'object':
      // null
      if (val === null) {
        return 'null';
      }

      // buffer
      if (Buffer.isBuffer(val)) {
        return 'buffer';
      }

      // array
      if (Array.isArray(val)) {
        return 'array';
      }

      // date
      if (val instanceof Date) {
        return 'date';
      }

      // object
      return 'object';
  }
};

/**
 * Returns a reformatted Object valid for consumption as remoting function
 * arguments
 */

SharedMethod.convertArg = function(accept, raw) {
  if(accept.http && (accept.http.source === 'req'
    || accept.http.source === 'res'
    || accept.http.source === 'context'
    )) {
    return raw;
  }
  if(raw === null || typeof raw !== 'object') {
    return raw;
  }
  var data = traverse(raw).forEach(function(x) {
    if(x === null || typeof x !== 'object') {
      return x;
    }
    var result = x;
    if(x.$type === 'base64' || x.$type === 'date') {
      switch (x.$type) {
        case 'base64':
          result = new Buffer(x.$data, 'base64');
          break;
        case 'date':
          result = new Date(x.$data);
          break;
      }
      this.update(result);
    }
    return result;
  });
  return data;
};

/**
 * Returns a reformatted Object valid for consumption as JSON from an Array of
 * results from a remoting function, based on `returns`.
 */

SharedMethod.toResult = function(returns, raw) {
  var result = {};

  if (!returns.length) {
    return;
  }

  returns = returns.filter(function (item, index) {
    if (index >= raw.length) {
      return false;
    }

    if (item.root) {
      result = convert(raw[index]);
      return false;
    }

    return true;
  });

  returns.forEach(function (item, index) {
    result[item.name || item.arg] = convert(raw[index]);
  });

  return result;

  function convert(val) {
    switch (SharedMethod.getType(val)) {
      case 'date':
        return {
          $type: 'date',
          $data: val.toString()
        };
      case 'buffer':
        return {
          $type: 'base64',
          $data: val.toString('base64')
        };
    }

    return val;
  }
};


/**
 * Get the function the `SharedMethod` will `invoke()`.
 */

SharedMethod.prototype.getFunction = function() {
  var fn;
  
  if(!this.ctor) return this.fn;

  if(this.isStatic) {
    fn = this.ctor[this.name];
  } else {
    fn = this.ctor.prototype[this.name];
  }

  return fn || this.fn;
}
