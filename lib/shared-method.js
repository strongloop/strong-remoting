// Copyright IBM Corp. 2013,2018. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

const g = require('strong-globalize')();

/*!
 * Expose `SharedMethod`.
 */
module.exports = SharedMethod;

const debug = require('debug')('strong-remoting:shared-method');
const util = require('util');
const traverse = require('traverse');
const assert = require('assert');
const Context = require('./context-base');
const numberChecks = require('./number-checks');

const isInteger = numberChecks.isSafeInteger;
const isSafeInteger = numberChecks.isSafeInteger;

/**
 * Create a new `SharedMethod` (remote method) with the given `fn`.
 * See also [Remote methods](http://docs.strongloop.com/display/LB/Remote+methods).
 *
 * @property {String} name The method name.
 * @property {String[]} aliases An array of method aliases.
 * @property {Boolean} isStatic Whether the method is static; from `options.isStatic`.
 * Default is `true`.
 * @property {Array|Object} accepts See `options.accepts`.
 * @property {Array|Object} returns See `options.returns`.
 * @property {Array|Object} errors See `options.errors`.
 * @property {String} description Text description of the method.
 * @property {String} notes Additional notes, used by API documentation generators like
 * Swagger.
 * @property {String} http
 * @property {Object} rest
 * @property {Boolean} shared
 * @property {Boolean} [documented] Default: true. Set to `false` to exclude the method
 * from Swagger metadata.
 *
 * @param {Function} fn The `Function` to be invoked when the method is invoked.
 * @param {String} name The name of the `SharedMethod`.
 * @param {SharedClass} sharedClass The `SharedClass` to which the method will be attached.
 *
 * @options {Object} options See below.
 * @property {Array|Object} [accepts] Defines either a single argument as an object or an
 * ordered set of arguments as an array.
 * @property {String} [accepts.arg] The name of the argument.
 * @property {String} [accepts.description] Text description of the argument, used by API
 * documentation generators like Swagger.
 * @property {String} [accepts.http] HTTP mapping for the argument. See argument mapping in
 * [the docs](http://docs.strongloop.com/x/-Yw6#Remotemethods-HTTPmappingofinputarguments).
 * @property {String} [accepts.http.source] The HTTP source for the  argument. May be one
 * of the following:
 *
 * - `req` - the Express `Request` object.
 * - `res` - the Express `Response` object.
 * - `body` - the `req.body` value.
 * - `form` - `req.body[argumentName]`.
 * - `query` - `req.query[argumentName]`.
 * - `path` - `req.params[argumentName]`.
 * - `header` - `req.headers[argumentName]`.
 * - `context` - the current `HttpContext`.
 * @property {Object} [accepts.rest] The REST mapping / settings for the argument.
 * @property {String} [accepts.type] Argument datatype; must be a
 * [Loopback type](http://docs.strongloop.com/display/LB/LoopBack+types).
 * @property {Array} [aliases] A list of aliases for the method.
 * @property {Array|Object} [errors] Object or `Array` containing error definitions.
 * @property {Array} [http] HTTP-only options.
 * @property {Number} [http.errorStatus] Default error status code.
 * @property {String} [http.path] HTTP path (relative to the model) at which the method is
 * exposed.
 * @property {Number} [http.status] Default status code when the callback is called
 * _without_ an error.
 * @property {String} [http.verb] HTTP method (verb) at which the method is available.
 * One of: get, post (default), put, del, or all
 * @property {Boolean} [isStatic] Whether the method is a static method or a prototype
 * method.
 * @property {Array|Object} [returns] Specifies the remote method's callback arguments;
 * either a single argument as an object or an ordered set of arguments as an array.
 * The `err` argument is assumed; do not specify.  NOTE: Can have the same properties as
 * `accepts`, except for `http.target`.
 *
 * Additionally, one of the callback arguments can have `type: 'file'` and
 * `root:true`, in which case this argument is sent in the raw form as
 * a response body. Allowed values: `String`, `Buffer` or `ReadableStream`
 * @property {Boolean} [shared] Whether the method is shared.  Default is `true`.
 * @property {Number} [status] The default status code.
 * @end
 *
 * @class
 */

function SharedMethod(fn, name, sc, options) {
  if (typeof options === 'boolean') {
    options = {isStatic: options};
  }

  this.fn = fn;
  fn = fn || {};
  this.name = name;
  assert(typeof name === 'string', 'The method name must be a string');
  options = options || {};
  this.aliases = options.aliases || [];
  const isStatic = this.isStatic = options.isStatic || false;
  this.accepts = options.accepts || fn.accepts || [];
  this.returns = options.returns || fn.returns || [];
  this.errors = options.errors || fn.errors || [];
  this.description = options.description || fn.description;
  this.accessType = options.accessType || fn.accessType;
  this.notes = options.notes || fn.notes;
  this.documented = options.documented !== false && fn.documented !== false;
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

  const firstReturns = this.returns[0];
  const streamTypes = ['ReadableStream', 'WriteableStream', 'DuplexStream'];

  if (firstReturns && firstReturns.type && streamTypes.indexOf(firstReturns.type) > -1) {
    this.streams = {returns: firstReturns};
  }

  if (this.errors && !Array.isArray(this.errors)) {
    this.errors = [this.errors];
  }

  if (/^prototype\./.test(name)) {
    const msg = 'Incorrect API usage. Shared methods on prototypes should be ' +
      'created via `new SharedMethod(fn, "name", { isStatic: false })`';
    throw new Error(msg);
  }

  this.stringName = (sc ? sc.name : '') + (isStatic ? '.' : '.prototype.') + name;

  // Include any remaining metadata to support custom user-defined extensions
  for (const key in options) {
    if (this[key]) continue;
    this[key] = options[key];
  }
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
 * @param {String} name
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
    rest: fn.rest,
  });
};

SharedMethod.prototype.getReturnArgDescByName = function(name) {
  const returns = this.returns;
  let desc;
  for (let i = 0; i < returns.length; i++) {
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
  assert(ctx, 'invocation context is required');

  const accepts = this.accepts;
  const returns = this.returns;
  const errors = this.errors;
  const method = this.getFunction();
  const sharedMethod = this;
  const formattedArgs = [];

  // map the given arg data in order they are expected in
  if (accepts) {
    for (let i = 0; i < accepts.length; i++) {
      const desc = accepts[i];
      const name = desc.name || desc.arg;
      let uarg = SharedMethod.convertArg(desc, args[name]);
      const conversionOptions = SharedMethod.getConversionOptionsForArg(desc);

      try {
        uarg = validateInputArgument(uarg, desc, ctx, conversionOptions);
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
    const rawArgs = [].slice.call(arguments, 1);
    const result = SharedMethod.toResult(returns, rawArgs, ctx);

    debug('- %s - result %j', sharedMethod.name, result);

    cb(null, result);
  }

  // add in the required callback
  formattedArgs.push(callback);

  debug('- %s - invoke with', this.name, formattedArgs);

  // invoke
  try {
    const retval = method.apply(scope, formattedArgs);
    if (retval && typeof retval.then === 'function') {
      return retval.then(
        function(args) {
          if (returns.length === 1) args = [args];
          const result = SharedMethod.toResult(returns, args, ctx);
          debug('- %s - promise result %j', sharedMethod.name, result);
          cb(null, result);
        },
        cb, // error handler
      );
    }
    return retval;
  } catch (err) {
    debug('error caught during the invocation of %s: %s',
      this.name, err.stack || err);
    return cb(err);
  }
};

function badArgumentError(msg) {
  const err = new Error(msg);
  err.statusCode = 400;
  return err;
}

function internalServerError(msg) {
  const err = new Error(msg);
  err.statusCode = 500;
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
 * @param  {Context} ctx       Remoting request context.
 * @return {*}                 Coerced argument.
 */
function validateInputArgument(uarg, desc, ctx, conversionOptions) {
  const name = desc.name || desc.arg;

  // Verify that a required argument has a value
  if (desc.required) {
    const argIsNotSet = uarg === null || uarg === undefined || uarg === '';
    if (argIsNotSet) {
      throw badArgumentError(g.f('%s is a required argument', name));
    }
  }

  const converter = ctx.typeRegistry.getConverter(desc.type);
  const err = converter.validate(ctx, uarg, conversionOptions);
  if (err) {
    err.message = g.f('Invalid argument %j. ', name) + err.message;
    throw err;
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
    case 'integer':
    case 'date':
    case 'boolean':
    case 'buffer':
    case 'object':
    case 'file':
    case 'any':
      return type;
    case 'array':
      return ['any'].map(convertToBasicRemotingType);
    default:
      // custom types like MyModel
      return 'object';
  }
}

/**
 * Returns an appropriate type based on `val`.
 * @param {*} val The value to determine the type for
 * @returns {String} The type name
 */

SharedMethod.getType = function(val, targetType) {
  const type = typeof val;

  switch (type) {
    case 'undefined':
    case 'boolean':
    case 'function':
    case 'string':
      return type;
    case 'number':
      return isInteger(val) && targetType === 'integer' ?
        'integer' : 'number';
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
  const isComputedArgument = accept.http && (
    typeof accept.http === 'function' ||
    accept.http.source === 'req' ||
    accept.http.source === 'res' ||
    accept.http.source === 'context');

  if (isComputedArgument) {
    return raw;
  }

  if (raw === null || typeof raw !== 'object') {
    return raw;
  }
  if (typeof raw === 'object' &&
      raw.constructor !== Object &&
      raw.constructor !== Array) {
    // raw is not plain
    return raw;
  }

  const data = traverse(raw).forEach(function(x) {
    if (x === null || typeof x !== 'object') {
      return x;
    }
    let result = x;
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
  let result = {};

  if (!returns.length) {
    return;
  }

  returns = returns.filter(function(item, index) {
    if (index >= raw.length) {
      return false;
    }

    if (ctx && ctx.setReturnArgByName(item.name || item.arg, raw[index])) {
      return false;
    }

    if (item.root) {
      const targetType = convertToBasicRemotingType(item.type);
      const isFile = targetType === 'file';
      result = isFile ? raw[index] : convert(raw[index], targetType, item.name);
      return false;
    }

    return true;
  });

  returns.forEach(function(item, index) {
    const name = item.name || item.arg;
    const targetType = convertToBasicRemotingType(item.type);
    if (targetType === 'file') {
      g.warn('%s: discarded non-root return argument %s of type "{{file}}"',
        this.stringName,
        name);
      return;
    }

    const value = convert(raw[index], targetType, name);
    result[name] = value;
  });

  return result;

  function convert(val, targetType, argName) {
    const targetTypeIsIntegerArray = Array.isArray(targetType) &&
      targetType.length === 1 && targetType[0] === 'integer';

    if (targetTypeIsIntegerArray && Array.isArray(val)) {
      const arrayTargetType = targetType[0];
      return val.map(function(intVal) {
        return convert(intVal, arrayTargetType, argName);
      });
    }

    const actualType = SharedMethod.getType(val, targetType);

    switch (actualType) {
      case 'date':
        return {
          $type: 'date',
          $data: val.toJSON ? val.toJSON() : val.toString(),
        };
      case 'buffer':
        return {
          $type: 'base64',
          $data: val.toString('base64'),
        };
      default:
        if (targetType === 'integer') {
          let message;

          if (!isInteger(val)) {
            message = g.f(
              'Invalid return value for argument \'%s\' of type ' +
              '\'%s\': %s. Received type was %s.',
              argName, targetType, val, typeof val,
            );
            throw internalServerError(message);
          }

          if (!isSafeInteger(val)) {
            message = g.f(
              'Unsafe integer value returned for argument \'%s\' of type ' +
              '\'%s\': %s.',
              argName, targetType, val,
            );
            throw internalServerError(message);
          }
          return val;
        }
        return val;
    }
  }
};

/**
 * Get the function the `SharedMethod` will `invoke()`.
 */

SharedMethod.prototype.getFunction = function() {
  let fn;

  if (!this.ctor) return this.fn;

  if (this.isStatic) {
    fn = this.ctor[this.name];
  } else {
    fn = this.ctor.prototype[this.name];
  }

  return fn || this.fn;
};

/**
 * Determine if this shared method invokes the given "suspect" function.
 *
 * @example
 * ```js
 * sharedMethod.isDelegateFor(myClass.myMethod); // pass a function
 * sharedMethod.isDelegateFor(myClass.prototype.myInstMethod);
 * sharedMethod.isDelegateFor('myMethod', true); // check for a static method by name
 * sharedMethod.isDelegateFor('myInstMethod', false); // instance method by name
 * ```
 *
 * @param {String|Function} suspect The name of the suspected function
 * or a `Function`.
 * @returns Boolean True if the shared method invokes the given function; false otherwise.
 */

SharedMethod.prototype.isDelegateFor = function(suspect, isStatic) {
  const type = typeof suspect;
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
 * Determine if this shared method invokes the given "suspect" function.
 *
 * @example
 * ```js
 * sharedMethod.isDelegateForName('myMethod'); // check for a static method by name
 * sharedMethod.isDelegateForName('prototype.myInstMethod'); // instance method by name
 * ```
 *
 * @returns Boolean True if the shared method invokes the given function; false otherwise.
 */

SharedMethod.prototype.isDelegateForName = function(suspect) {
  assert(typeof suspect === 'string', 'argument of isDelegateForName should be string');

  const m = suspect.match(/^prototype\.(.*)$/);
  const isStatic = !m;
  const baseName = isStatic ? suspect : m[1];
  return this.isDelegateFor(baseName, isStatic);
};

/**
 * Add an alias
 *
 * @param {String} alias Alias method name.
 */

SharedMethod.prototype.addAlias = function(alias) {
  if (this.aliases.indexOf(alias) === -1) {
    this.aliases.push(alias);
  }
};

/**
 * build conversion options from remote's' args
 *
 * @param {Object} arg Definition of accepts/returns argument.
 * @returns {Object} Options object to pass to type-converter methods,  e.g `validate` or `fromTypedValue`.
 */
SharedMethod.getConversionOptionsForArg = function(arg) {
  const options = {};

  // option for object coercion to allow Array of objects as well as objects
  if (arg.allowArray) {
    options.allowArray = arg.allowArray;
  }
  return options;
};
