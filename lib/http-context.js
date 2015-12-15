/*!
 * Expose `HttpContext`.
 */

module.exports = HttpContext;

/*!
 * Module dependencies.
 */

var EventEmitter = require('events').EventEmitter;
var debug = require('debug')('strong-remoting:http-context');
var util = require('util');
var inherits = util.inherits;
var assert = require('assert');
var Dynamic = require('./dynamic');
var httpCoerce = require('./http-coerce');
var js2xmlparser = require('js2xmlparser');
var DEFAULT_SUPPORTED_TYPES = [
    'application/json', 'application/javascript', 'application/xml',
    'text/javascript', 'text/xml',
    'json', 'xml' ,
    '*/*'
    ];

/*!
 * This comment is here as a workaround for a strong-docs bug.
 * The above array value leads to spurious doc output.
 */

var MuxDemux = require('mux-demux');
var SSEClient = require('sse').Client;

/**
 * Create a new `HttpContext` with the given `options`.
 * Invoking a remote method via HTTP creates `HttpContext` object.
 *
 * @param {Object} req Express Request object.
 * @param {Object} res Express Response object.
 * @param {Function} method A [SharedMethod](#sharedmethod)
 * @options {Object} options See below.
 * @property {Boolean} xml Set to `true` to enable XML-based types.  Default is false.
 * @class
 */

function HttpContext(req, res, method, options) {
  this.req = req;
  this.res = res;
  this.method = method;
  this.options = options || {};
  this.args = this.buildArgs(method);
  this.methodString = method.stringName;
  this.supportedTypes = this.options.supportedTypes || DEFAULT_SUPPORTED_TYPES;
  this.result = {};

  var streamsDesc = method.streams;
  var returnStreamDesc = streamsDesc && streamsDesc.returns;
  var methodReturnsStream = !!returnStreamDesc;

  if (this.supportedTypes === DEFAULT_SUPPORTED_TYPES && !this.options.xml) {
    // Disable all XML-based types by default
    this.supportedTypes = this.supportedTypes.filter(function(type) {
      return !/\bxml\b/i.test(type);
    });
  }

  req.remotingContext = this;

  // streaming support
  if (methodReturnsStream) {
    this.createStream();
  }
}

/*!
 * Inherit from `EventEmitter`.
 */

inherits(HttpContext, EventEmitter);

HttpContext.prototype.createStream = function() {
  var streamsDesc = this.method.streams;
  var returnStreamDesc = streamsDesc && streamsDesc.returns;
  var mdm = this.muxDemuxStream = new MuxDemux();
  var io = this.io = {};
  var res = this.res;

  debug('create stream');

  if (returnStreamDesc.json && returnStreamDesc.type === 'ReadableStream') {

    if (!this.shouldReturnEventStream()) {
      res.setHeader('Content-Type',
      returnStreamDesc.contentType || 'application/json; boundary=NL');
      res.setHeader('Transfer-Encoding', 'chunked');

      this.io.out = mdm.createWriteStream();
      // since the method returns a ReadableStream
      // setup an output to pipe the ReadableStream to
      mdm.pipe(res);
    }
  }
};

/**
 * Build args object from the http context's `req` and `res`.
 */

HttpContext.prototype.buildArgs = function(method) {
  var args = {};
  var ctx = this;
  var accepts = method.accepts;

  // build arguments from req and method options
  for (var i = 0, n = accepts.length; i < n; i++) {
    var o = accepts[i];
    var httpFormat = o.http;
    var name = o.name || o.arg;
    var val;
    var doSloppyCoerce = true;

    // This is an http method keyword, which requires special parsing.
    if (httpFormat) {
      switch (typeof httpFormat) {
        case 'function':
          // the options have defined a formatter
          val = httpFormat(ctx);
          break;
        case 'object':
          switch (httpFormat.source) {
            case 'body':
              val = ctx.req.body;
              break;
            case 'form':
              // From the form (body)
              val = ctx.req.body && ctx.req.body[name];
              break;
            case 'query':
              // From the query string
              val = ctx.req.query[name];
              break;
            case 'path':
              // From the url path
              val = ctx.req.params[name];
              break;
            case 'header':
              val = ctx.req.get(name);
              break;
            case 'req':
              doSloppyCoerce = false; // complex object
              // Direct access to http req
              val = ctx.req;
              break;
            case 'res':
              doSloppyCoerce = false; // complex object
              // Direct access to http res
              val = ctx.res;
              break;
            case 'context':
              doSloppyCoerce = false; // complex object
              // Direct access to http context
              val = ctx;
              break;
          }
          break;
      }
    } else {
      val = ctx.getArgByName(name, o);
    }

    // If this is from the body and we were doing a JSON POST, turn off sloppy coercion.
    // This is because JSON, unlike other methods, properly retains types like Numbers,
    // Booleans, and null/undefined.
    if (ctx.req.body && ctx.req.get('content-type') && 
        ctx.req.get('content-type').substr(0, 16) === 'application/json' &&
        (ctx.req.body === val || ctx.req.body[name] === val)) {
      doSloppyCoerce = false;
    }

    // Most of the time, the data comes through 'sloppy' methods like HTTP headers or a qs
    // which don't preserve types. If so, if we are:
    //
    // * Expecting an array
    // * Expecting an object
    // * Using the type 'any'
    //
    // Use some sloppy typing semantics to try to guess what the user meant to send.
    if (doSloppyCoerce &&
        (o.type === 'any' || Array.isArray(o.type) || o.type === 'object')) {
      val = httpCoerce(val, o.type, ctx);
    }

    // Convert input so it always matches the method definition.
    // The user can also define new dynamic types.
    if (Dynamic.canConvert(o.type)) {
      val = new Dynamic(val, ctx).to(o.type);
    }

    // Set the argument value.
    args[o.arg] = val;
  }

  return args;
};

/**
 * Get an arg by name using the given options.
 *
 * @param {String} name
 * @param {Object} options **optional**
 */

HttpContext.prototype.getArgByName = function(name, options) {
  var req = this.req;

  // search these in order by name
  var arg = req.params[name] !== undefined ? req.params[name] :           // params
            (req.body && req.body[name]) !== undefined ? req.body[name] : // body
            req.query[name] !== undefined ? req.query[name] :             // query
            req.get(name);                                                // header

  return arg;
};

function buildArgs(ctx, method, fn) {
  try {
    return ctx.buildArgs(method);
  } catch (err) {
    // JSON.parse() might throw
    process.nextTick(function() {
      fn(err);
    });
    return undefined;
  }
}

/**
 * Invoke the given shared method using the provided scope against the current context.
 */

HttpContext.prototype.invoke = function(scope, method, fn, isCtor) {
  var args = this.args;
  if (isCtor) {
    args = this.ctorArgs = buildArgs(this, method, fn);
    if (args === undefined) {
      return;
    }
  }
  var http = method.http;
  var pipe = http && http.pipe;
  var pipeDest = pipe && pipe.dest;
  var pipeSrc = pipe && pipe.source;
  var ctx = this;
  var defaultErrorStatus = http && http.errorStatus;
  var res = this.res;

  if (pipeDest) {
    // only support response for now
    switch (pipeDest) {
      case 'res':
        // Probably not correct...but passes my test.
        this.res.header('Content-Type', 'application/json');
        this.res.header('Transfer-Encoding', 'chunked');

        var stream = method.invoke(scope, args, this.options, ctx, fn);
        stream.pipe(this.res);
        break;
      default:
        fn(new Error('unsupported pipe destination'));
        break;
    }
  } else if (pipeSrc) {
    // only support request for now
    switch (pipeDest) {
      case 'req':
        this.req.pipe(method.invoke(scope, args, this.options, ctx, fn));
        break;
      default:
        fn(new Error('unsupported pipe source'));
        break;
    }
  } else {
    // simple invoke
    method.invoke(scope, args, this.options, ctx, function(err, result) {
      if (err) {
        if (defaultErrorStatus &&
          (res.statusCode === undefined || res.statusCode === 200)) {
          res.status(err.status || err.statusCode || defaultErrorStatus);
        }
        return fn(err);
      }
      fn(null, result);
    });
  }
};

HttpContext.prototype.setReturnArgByName = function(name, value) {
  var returnDesc = this.method.getReturnArgDescByName(name);
  var result = this.result;
  var res = this.res;

  if (!returnDesc) {
    return debug('warning: cannot set return value for arg' +
      ' (%s) without description!', name);
  }

  if (returnDesc.root) {
    this.result = value;
  } else if (returnDesc.http) {
    switch (returnDesc.http.target) {
      case 'status':
        res.status(value);
        break;
      case 'header':
        res.set(returnDesc.http.header || name, value);
        break;
    }
  } else {
    result[name] = value;
  }
};

function toJSON(input) {
  if (!input) {
    return input;
  }
  if (typeof input.toJSON === 'function') {
    return input.toJSON();
  } else if (Array.isArray(input)) {
    return input.map(toJSON);
  } else {
    return input;
  }
}

function toXML(input) {
  var xml;
  if (input && typeof input.toXML === 'function') {
    xml = input.toXML();
  } else {
    if (input) {
      // Trigger toJSON() conversions
      input = toJSON(input);
    }
    if (Array.isArray(input)) {
      input = { result: input };
    }
    xml = js2xmlparser('response', input, {
      prettyPrinting: {
        indentString: '  '
      },
      convertMap: {
        '[object Date]': function(date) {
          return date.toISOString();
        }
      }
    });
  }
  return xml;
}

HttpContext.prototype.shouldReturnEventStream = function() {
  var req = this.req;
  var query = req.query;
  var format = query._format;

  var acceptable = req.accepts('text/event-stream');
  return (format === 'event-stream') || acceptable;
};

HttpContext.prototype.respondWithEventStream = function(stream) {
  var client = new SSEClient(this.req, this.res);

  client.initialize();

  stream.on('data', function(chunk) {
    client.send('data', JSON.stringify(chunk));
  });

  stream.on('error', function(err) {
    var outErr = {message: err.message};
    for (var key in err) {
      outErr[key] = err[key];
    }
    client.send('error', JSON.stringify(outErr));
  });

  stream.on('end', function() {
    client.send({event: 'end', data: 'null'});
  });
};

/**
 * Finish the request and send the correct response.
 */

HttpContext.prototype.done = function(cb) {
  var ctx = this;
  var method = this.method;
  var streamsDesc = method.streams;
  var returnStreamDesc = streamsDesc && streamsDesc.returns;
  var methodReturnsStream = !!returnStreamDesc;
  var res = this.res;
  var out = this.io && this.io.out;
  var err = this.error;
  var result = this.result;

  if (methodReturnsStream) {
    if (returnStreamDesc.json) {
      debug('handling json stream');

      var stream = result[returnStreamDesc.arg];

      if (returnStreamDesc.type === 'ReadableStream') {
        if (ctx.shouldReturnEventStream()) {
          debug('respondWithEventStream');
          ctx.respondWithEventStream(stream);
          return;
        }

        debug('piping to mdm stream');
        stream.pipe(out);
        stream.on('error', function(err) {
          var outErr = {message: err.message};
          for (var key in err) {
            outErr[key] = err[key];
          }

          // this is the reason we are using mux-demux
          out.error(outErr);

          out.end();
        });
        // TODO(ritch) support multi-part streams
      } else {
        cb(new Error('unsupported stream type: ' + returnStreamDesc.type));
      }
    } else {
      cb(new Error('Unsupported stream descriptor, only descriptors ' +
        'with property "json:true" are supported'));
    }
    return;
  }

  // send the result back as
  // the requested content type
  var data = this.result;
  var accepts = this.req.accepts(this.supportedTypes);
  var defaultStatus = this.method.http.status;

  if (defaultStatus) {
    res.status(defaultStatus);
  }

  if (this.req.query._format) {
    accepts = this.req.query._format.toLowerCase();
  }
  var dataExists = typeof data !== 'undefined';

  if (dataExists) {
    switch (accepts) {
      case '*/*':
      case 'application/json':
      case 'json':
        res.json(data);
        break;
      case 'application/vnd.api+json':
        res.header('Content-Type', 'application/vnd.api+json');
        res.json(data);
        break;
      case 'application/javascript':
      case 'text/javascript':
        res.jsonp(data);
        break;
      case 'application/xml':
      case 'text/xml':
      case 'xml':
        if (accepts === 'application/xml') {
          res.header('Content-Type', 'application/xml');
        } else {
          res.header('Content-Type', 'text/xml');
        }
        if (data === null) {
          res.header('Content-Length', '7');
          res.end('<null/>');
        } else {
          try {
            var xml = toXML(data);
            res.send(xml);
          } catch (e) {
            res.status(500).send(e + '\n' + data);
          }
        }
        break;
      default:
        res.status(406).send('Not Acceptable');
        break;
    }
  } else {
    if (!res.get('Content-Type')) {
      res.header('Content-Type', 'application/json');
    }
    if (res.statusCode === undefined || res.statusCode === 200) {
      res.statusCode = 204;
    }
    res.end();
  }

  cb();
};
