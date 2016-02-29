/**
 * Expose `httpCoerce`
 */

module.exports = httpCoerce;

/**
 * Do a sloppy string coercion into a target type.
 * Useful for params sent via HTTP params, querystring, headers, or non-JSON body.
 *
 * @param {*} val  Value to coerce. Only works on strings, just returns non-string values.
 * @param {string|Array<String>} targetType Type to coerce to.
 * @param {Context} ctx HTTP Context.
 */

function httpCoerce(val, targetType, ctx) {
  // If an array type if defined, regardless of what type it is, try to coerce the string
  // into an array.
  if (Array.isArray(targetType)) {
    val = coerceArray(val, ctx);
    // Members may need to be coerced as well.
    val = val.map(function(v) {
      return httpCoerce(v, targetType[0], ctx);
    });
  } else if (val === null) {
    return val;
  } else if (val === undefined || val === '') {
    // Pass on undefined/empty string as undefined.
    // undefined was chosen so that it plays well with ES6 default parameters.
    return undefined;
  } else if (coerceMap.hasOwnProperty(val)) { // null, false, etc strings
    return coerceMap[val];
  } else if (targetType === 'boolean') {
    val = coerceToBoolean(val);
  } else if (targetType === 'number') {
    val = coerceToNumber(val);
  } else if (targetType === 'any' || targetType === 'object') {
    if (val && typeof val === 'object') {
      // Objects should have all their members coerced.
      var props = Object.keys(val);
      for (var i = 0, n = props.length; i < n; i++) {
        var key = props[i];
        val[key] = httpCoerce(val[key], 'any', ctx);
      }
    } else {
      // If the targetType specified is 'any', do sloppy string conversion.
      val = coerceString(val);
    }
  }
  return val;
}

/*!
 * Integer test regexp. Doesn't match if number has a leading zero.
 */

var isInt = /^\-?(?:[0-9]|[1-9][0-9]*)$/;

/*!
 * Float test regexp.
 */

var isFloat = /^([0-9]+)?\.[0-9]+$/;
var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || Math.pow(2, 53) - 1;

function coerceString(val) {
  if (typeof val !== 'string') return val;
  if (coerceMap.hasOwnProperty(val)) return coerceMap[val];
  if (isFloat.test(val) || isInt.test(val)) {
    var out = Number(val);
    // Cap at MAX_SAFE_INTEGER so we don't lose precision.
    if (out > MAX_SAFE_INTEGER) out = val;
    return out;
  }
  // Nothing matched; return string.
  return val;
}

function coerceToBoolean(val) {
  switch (typeof val) {
    case 'string':
      switch (val) {
        case 'false':
        case 'undefined':
        case 'null':
        case '0':
          return false;
        default:
          return true;
      }
      break;
    case 'number':
      return val !== 0;
    default:
      return Boolean(val);
  }
}

// Number() constructor usually does the right thing, but on really malformed input
// it actually returns 0. We don't want that, so we check if parseFloat()
// returned NaN first. Stricter is better here, we don't want to convert weird
// things like '1x' to 1, but '1e8' > 100000000 is okay.
function coerceToNumber(val) {
  if (isNaN(parseFloat(val))) return NaN;
  return Number(val);
}

function coerceArray(val, ctx) {
  if (val === undefined || val === null || val === '') return [];
  if (Array.isArray(val)) return val;
  // If it looks like an array, try to parse it.
  if (val[0] === '[') {
    try {
      return JSON.parse(val);
    } catch (ex) { /* Do nothing */ }
  }

  // The user may set delimiters like ',', or ';' to designate array items
  // for easier usage.
  var delims = ctx.options && ctx.options.arrayItemDelimiters;
  if (delims) {
    // Construct delimiter regex if input was an array. Overwrite option
    // so this only needs to happen once.
    if (Array.isArray(delims)) {
      delims = new RegExp(delims.map(escapeRegex).join('|'), 'g');
      ctx.options.arrayItemDelimiters = delims;
    }
    return val.split(delims);
  }
  // Alright, not array-like, just wrap it in an array on the way out.
  return [val];
}

// see http://stackoverflow.com/a/6969486/69868
function escapeRegex(d) {
  return d.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}

// Map of some values to convert directly to primitives.
var coerceMap = {
  'false': false,
  'true': true,
  'undefined': undefined,
  'null': null
};
