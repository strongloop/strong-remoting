/*!
 * Expose `SharedMethod`.
 */

module.exports = SharedMethod;

/*!
 * Module dependencies.
 */

var debug = require('debug')('strong-remoting:shared-method');
var util = require('util');
var traverse = require('traverse');
var assert = require('assert');

/**
 * Create a new `SharedMethod` with the given `fn`.
 *
 * @class SharedMethod
 * @param {Function} fn The `Function` to be invoked when the method is invoked
 * @param {String} name The name of the `SharedMethod`
 * @param {SharedClass} sharedClass The `SharedClass` the method will be attached to
 * @param {Object|Boolean} options
 * @param {Boolean} [options.isStatic] Is the method a static method or a
 * a `prototype` method
 * @param {Array} [options.aliases] A list of aliases for the
 * @param {Array} [options.http] HTTP only options
 * @param {Number} [options.http.status] The default status code
 * @param {Number} [options.http.errorStatus] The default error status code
 * `sharedMethod.name`
 * @param {Array|Object} [options.accepts] An `Array` of argument definitions
 * that describe the arguments of the `SharedMethod`.
 * @param {Boolean} [options.shared] Default is `true`
 * @param {String} [options.accepts.arg] The name of the argument
 * @param {String} [options.accepts.http] HTTP mapping for the argument
 * @param {String} [options.accepts.http.source] The HTTP source for the
 * argument. May be one of the following:
 *
 * - `req` - the Express `Request` object
 * - `req` - the Express `Request` object
 * - `body` - the `req.body` value
 * - `form` - `req.body[argumentName]`
 * - `query` - `req.query[argumentName]`
 * - `path` - `req.params[argumentName]`
 * - `header` - `req.headers[argumentName]`
 * - `context` - the current `HttpContext`
 * @param {Object} [options.accepts.rest] The REST mapping / settings for the
 * argument.
 * @param {Array|Object} [options.returns] An `Array` of argument definitions
 * @param {Array|Object} [options.errors] An `Array` of error definitions
 * The same options are available as `options.accepts`.
 * @property {String} name The method name
 * @property {String[]} aliases An array of method aliases
 * @property {Array|Object} isStatic
 * @property {Array|Object} accepts See `options.accepts`
 * @property {Array|Object} returns See `options.returns`
 * @property {Array|Object} errors See `options.errors`
 * @property {String} description
 * @property {String} notes
 * @property {String} http
 * @property {String} rest
 * @property {String} shared
 * @property {Boolean} [documented] Default: true. Set to `false` to exclude
 *   the method from Swagger metadata.
 */

function SharedMethod(fn, name, sc, options) {
  if (typeof options === 'boolean') {
    options = { isStatic: options };
  }

  this.fn = fn;
  fn = fn || {};
  this.name = name;
  assert(typeof name === 'string', 'The method name must be a string');
  options = options || {};
  this.aliases = options.aliases || [];
  var isStatic = this.isStatic = options.isStatic || false;
  this.accepts = options.accepts || fn.accepts || [];
  this.returns = options.returns || fn.returns || [];
  this.errors = options.errors || fn.errors || [];
  this.description = options.description || fn.description;
  this.accessType = options.accessType || fn.accessType;
  this.notes = options.notes || fn.notes;
  this.documented = (options.documented || fn.documented) !== false;
  this.http = options.http || fn.http || {};
  this.rest = options.rest || fn.rest || {};
  this.shared = options.shared;
  if (this.shared === undefined) {
    this.shared = true;
  }
  if (fn.shared === false) {
    this.shared = false;
  }
  this.sharedClass = sc;

  if (sc) {
    this.ctor = sc.ctor;
    this.sharedCtor = sc.sharedCtor;
  }
  if (name === 'sharedCtor') {
    this.isSharedCtor = true;
  }

  if (this.accepts && !Array.isArray(this.accepts)) {
    this.accepts = [this.accepts];
  }
  this.accepts.forEach(normalizeArgumentDescriptor);

  if (this.returns && !Array.isArray(this.returns)) {
    this.returns = [this.returns];
  }
  this.returns.forEach(normalizeArgumentDescriptor);

  if (this.errors && !Array.isArray(this.errors)) {
    this.errors = [this.errors];
  }

  this.stringName = (sc ? sc.name : '') + (isStatic ? '.' : '.prototype.') + name;
}

function normalizeArgumentDescriptor(desc) {
  if (desc.type === 'array')
    desc.type = ['any'];
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
    errors: fn.errors,
    description: fn.description,
    notes: fn.notes,
    http: fn.http,
    rest: fn.rest
  });
};

SharedMethod.prototype.getReturnArgDescByName = function(name) {
  var returns = this.returns;
  var desc;
  for (var i = 0; i < returns.length; i++) {
    desc = returns[i];
    if (desc && ((desc.arg || desc.name) === name)) {
      return desc;
    }
  }
};

/**
 * Execute the remote method using the given arg data.
 *
 * @param {Object} scope `this` parameter for the invocation
 * @param {Object} args containing named argument data
 * @param {Object=} remotingOptions remote-objects options
 * @param {Function} cb callback `fn(err, result)` containing named result data
 */

SharedMethod.prototype.invoke = function(scope, args, remotingOptions, ctx, cb) {
  var accepts = this.accepts;
  var returns = this.returns;
  var errors = this.errors;
  var method = this.getFunction();
  var sharedMethod = this;
  var formattedArgs = [];

  if (typeof ctx === 'function') {
    cb = ctx;
    ctx = undefined;
  }

  if (cb === undefined && typeof remotingOptions === 'function') {
    cb = remotingOptions;
    remotingOptions = {};
  }

  // map the given arg data in order they are expected in
  if (accepts) {
    for (var i = 0; i < accepts.length; i++) {
      var desc = accepts[i];
      var name = desc.name || desc.arg;
      var uarg = SharedMethod.convertArg(desc, args[name]);

      try {
        uarg = coerceAccepts(uarg, desc, name);
      } catch (e) {
        debug('- %s - ' + e.message, sharedMethod.name);
        return cb(e);
      }
      // Add the argument even if it's undefined to stick with the accepts
      formattedArgs.push(uarg);
    }
  }

  // define the callback
  function callback(err) {
    if (err) {
      return cb(err);
    }
    // args without err
    var rawArgs = [].slice.call(arguments, 1);
    var result = SharedMethod.toResult(returns, rawArgs, ctx);

    debug('- %s - result %j', sharedMethod.name, result);

    cb(null, result);
  }

  // add in the required callback
  formattedArgs.push(callback);

  debug('- %s - invoke with', this.name, formattedArgs);

  // invoke
  try {
    var retval = method.apply(scope, formattedArgs);
    if (retval && typeof retval.then === 'function') {
      return retval.then(
        function(args) {
          if (returns.length === 1) args = [args];
          var result = SharedMethod.toResult(returns, args);
          debug('- %s - promise result %j', sharedMethod.name, result);
          cb(null, result);
        },
        cb // error handler
      );
    }
    return retval;
  } catch (err) {
    debug('error caught during the invocation of %s', this.name);
    return cb(err);
  }
};

function badArgumentError(msg) {
  var err = new Error(msg);
  err.statusCode = 400;
  return err;
}

function escapeRegex(d) {
  // see http://stackoverflow.com/a/6969486/69868
  return d.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}

/**
 * Coerce an 'accepts' value into its final type.
 * If using HTTP, some coercion is already done in http-context.
 *
 * This should only do very simple coercion.
 *
 * @param  {*} uarg            Argument value.
 * @param  {Object} desc       Argument description.
 * @return {*}                 Coerced argument.
 */
function coerceAccepts(uarg, desc) {
  var name = desc.name || desc.arg;
  var targetType = convertToBasicRemotingType(desc.type);
  var targetTypeIsArray = Array.isArray(targetType) && targetType.length === 1;

  // If coercing an array to an erray,
  // then coerce all members of the array too
  if (targetTypeIsArray && Array.isArray(uarg)) {
    return uarg.map(function(arg, ix) {
      // when coercing array items, use only name and type,
      // ignore all other root settings like "required"
      return coerceAccepts(arg, {
        name: name + '[' + ix + ']',
        type: targetType[0]
      });
    });
  }

  var actualType = SharedMethod.getType(uarg);

  // convert values to the correct type
  // TODO(bajtos) Move conversions to HttpContext (and friends)
  // SharedMethod should only check that argument values match argument types.
  var conversionNeeded = targetType !== 'any' &&
    actualType !== 'undefined' &&
    actualType !== targetType;

  if (conversionNeeded) {
    // JSON.parse can throw, so catch this error.
    try {
      uarg = convertValueToTargetType(name, uarg, targetType);
      actualType = SharedMethod.getType(uarg);
    } catch (e) {
      var message = util.format('invalid value for argument \'%s\' of type ' +
        '\'%s\': %s. Received type was %s. Error: %s',
        name, targetType, uarg, typeof uarg, e.message);
      throw new badArgumentError(message);
    }
  }

  var typeMismatch = targetType !== 'any' &&
    actualType !== 'undefined' &&
    targetType !== actualType &&
    // In JavaScript, an array is an object too (typeof [] === 'object').
    // However, SharedMethod.getType([]) returns 'array' instead of 'object'.
    // We must explicitly allow assignment of an array value to an argument
    // of type 'object'.
    !(targetType === 'object' && actualType === 'array');

  if (typeMismatch) {
    var message = util.format('Invalid value for argument \'%s\' of type ' +
      '\'%s\': %s. Received type was converted to %s.',
      name, targetType, uarg, typeof uarg);
    throw new badArgumentError(message);
  }

  // Verify that a required argument has a value
  // FIXME(bajtos) "null" should be treated as no value too
  if (actualType === 'undefined') {
    if (desc.required) {
      throw new badArgumentError(name + ' is a required arg');
    } else {
      return undefined;
    }
  }

  if (actualType === 'number' && Number.isNaN(uarg)) {
    throw new badArgumentError(name + ' must be a number');
  }

  return uarg;
}

/**
 * Returns an appropriate type based on a type specifier from remoting
 * metadata.
 * @param {Object} type A type specifier from remoting metadata,
 *    e.g. "[Number]" or "MyModel" from `accepts[0].type`.
 * @returns {String} A type name compatible with the values returned by
 *   `SharedMethod.getType()`, e.g. "string" or "array".
 */
function convertToBasicRemotingType(type) {
  if (Array.isArray(type)) {
    return type.map(convertToBasicRemotingType);
  }

  if (typeof type === 'object') {
    type = type.modelName || type.name;
  }

  type = String(type).toLowerCase();

  switch (type) {
    case 'string':
    case 'number':
    case 'date':
    case 'boolean':
    case 'buffer':
    case 'object':
    case 'any':
      return type;
    case 'array':
      return ['any'].map(convertToBasicRemotingType);
    default:
      // custom types like MyModel
      return 'object';
  }
}

function convertValueToTargetType(argName, value, targetType) {
  switch (targetType) {
    case 'string':
      return String(value).valueOf();
    case 'date':
      return new Date(value);
    case 'number':
      return Number(value).valueOf();
    case 'boolean':
      return Boolean(value).valueOf();
    // Other types such as 'object', 'array',
    // ModelClass, ['string'], or [ModelClass]
    default:
      switch (typeof value) {
        case 'string':
          return JSON.parse(value);
        case 'object':
          return value;
        default:
          throw new badArgumentError(argName + ' must be ' + targetType);
      }
  }
}

/**
 * Returns an appropriate type based on `val`.
 * @param {*} val The value to determine the type for
 * @returns {String} The type name
 */

SharedMethod.getType = function(val) {
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
  if (accept.http && (accept.http.source === 'req' ||
    accept.http.source === 'res' ||
    accept.http.source === 'context'
    )) {
    return raw;
  }
  if (raw === null || typeof raw !== 'object') {
    return raw;
  }
  var data = traverse(raw).forEach(function(x) {
    if (x === null || typeof x !== 'object') {
      return x;
    }
    var result = x;
    if (x.$type === 'base64' || x.$type === 'date') {
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

SharedMethod.toResult = function(returns, raw, ctx) {
  var result = {};

  if (!returns.length) {
    return;
  }

  returns = returns.filter(function(item, index) {
    if (index >= raw.length) {
      return false;
    }

    if (item.root) {
      result = convert(raw[index]);
      if (ctx) ctx.setReturnArgByName(item.name || item.arg, raw[index]);
      return false;
    }

    return true;
  });

  returns.forEach(function(item, index) {
    var value = convert(raw[index]);
    var name = item.name || item.arg;
    result[name] = value;
    if (ctx) ctx.setReturnArgByName(name, value);
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

  if (!this.ctor) return this.fn;

  if (this.isStatic) {
    fn = this.ctor[this.name];
  } else {
    fn = this.ctor.prototype[this.name];
  }

  return fn || this.fn;
};

/**
 * Will this shared method invoke the given `suspect`?
 *
 * ```js
 * // examples
 * sharedMethod.isDelegateFor(myClass.myMethod); // pass a function
 * sharedMethod.isDelegateFor(myClass.prototype.myInstMethod);
 * sharedMethod.isDelegateFor('myMethod', true); // check for a static method by name
 * sharedMethod.isDelegateFor('myInstMethod', false); // instance method by name
 * ```
 *
 * @param {String|Function} suspect The name of the suspected function
 * or a `Function`.
 */

SharedMethod.prototype.isDelegateFor = function(suspect, isStatic) {
  var type = typeof suspect;
  isStatic = isStatic || false;

  if (suspect) {
    switch (type) {
      case 'function':
        return this.getFunction() === suspect;
      case 'string':
        if (this.isStatic !== isStatic) return false;
        return this.name === suspect || this.aliases.indexOf(suspect) !== -1;
    }
  }

  return false;
};

/**
 * Add an alias
 *
 * @param {String} alias
 */

SharedMethod.prototype.addAlias = function(alias) {
  if (this.aliases.indexOf(alias) === -1) {
    this.aliases.push(alias);
  }
};
