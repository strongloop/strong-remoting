// Copyright IBM Corp. 2013,2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var assert = require('assert');
var extend = require('util')._extend;
var inherits = require('util').inherits;
var RemoteObjects = require('../');
var SharedClass = RemoteObjects.SharedClass;
var express = require('express');
var request = require('supertest');
var expect = require('chai').expect;
var factory = require('./helpers/shared-objects-factory.js');
var Promise = global.Promise || require('bluebird');
var Readable = require('stream').Readable;

var ACCEPT_XML_OR_ANY = 'application/xml,*/*;q=0.8';
var TEST_ERROR = new Error('expected test error');

describe('strong-remoting-rest', function() {
  var app, appSupportingJsonOnly, server, objects, remotes, lastRequest, lastResponse,
    restHandlerOptions;
  var adapterName = 'rest';

  before(function(done) {
    app = express();
    app.disable('x-powered-by');
    app.use(function(req, res, next) {
      // create the handler for each request
      const handler = objects.handler(adapterName, restHandlerOptions);
      handler.apply(objects, arguments);
      lastRequest = req;
      lastResponse = res;
    });
    server = app.listen(done);
  });

  before(function(done) {
    appSupportingJsonOnly = express();
    appSupportingJsonOnly.use(function(req, res, next) {
      // create the handler for each request
      var supportedTypes = ['json', 'application/javascript', 'text/javascript'];
      var opts = {supportedTypes: supportedTypes};
      objects.handler(adapterName, opts).apply(objects, arguments);
    });
    server = appSupportingJsonOnly.listen(done);
  });

  // setup
  beforeEach(function() {
    restHandlerOptions = undefined;

    objects = RemoteObjects.create({
      json: {limit: '1kb'},
      errorHandler: {debug: true, log: false},
      types: {warnOnUnknownType: false},
    });
    remotes = objects.exports;

    // connect to the app
    objects.connect('http://localhost:' + server.address().port, adapterName);
  });

  function json(method, url) {
    if (url === undefined) {
      url = method;
      method = 'get';
    }

    return request(app)[method](url)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/);
  }

  function xml(method, url) {
    if (url === undefined) {
      url = method;
      method = 'get';
    }

    return request(app)[method](url)
      .set('Accept', 'application/xml')
      .set('Content-Type', 'application/xml')
      .expect('Content-Type', /xml/);
  }

  describe('remoting options', function() {
    // The 1kb limit is set by RemoteObjects.create({json: {limit: '1kb'}});
    it('should reject json payload larger than 1kb', function(done) {
      var method = givenSharedStaticMethod(
        function greet(msg, cb) {
          cb(null, msg);
        },
        {
          accepts: {arg: 'person', type: 'string', http: {source: 'body'}},
          returns: {arg: 'msg', type: 'string'},
        }
      );

      // Build an object that is larger than 1kb
      var name = '';
      for (var i = 0; i < 2048; i++) {
        name += '11111111111';
      }

      request(app).post(method.url)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .send(name)
        .expect(413, done);
    });

    it('should allow custom error handlers', function(done) {
      var called = false;
      var method = givenSharedStaticMethod(
        function(cb) {
          cb(new Error('foo'));
        }
      );

      objects.options.errorHandler.handler = function(err, req, res, next) {
        expect(err.message).to.contain('foo');
        err = new Error('foobar');
        called = true;
        next(err);
      };

      request(app).get(method.url)
        .expect('Content-Type', /json/)
        .expect(500)
        .end(expectErrorResponseContaining({message: 'foobar'}, function(err) {
          expect(called).to.eql(true);
          done(err);
        }));
    });

    it('should exclude stack traces by default', function(done) {
      var method = givenSharedStaticMethod(
        function(cb) { cb(new Error('test-error')); });

      // reset the errorHandler options
      objects.options.errorHandler = {};

      request(app).get(method.url)
        .expect('Content-Type', /json/)
        .expect(500)
        .end(expectErrorResponseContaining(
          {message: 'Internal Server Error'}, ['stack'], done));
    });

    it('should turn off url-not-found handler', function(done) {
      objects.options.rest = {handleUnknownPaths: false};
      app.use(function(req, res, next) {
        res.status(404).send('custom-not-found');
      });

      request(app).get('/thisUrlDoesNotExists/someMethod')
        .expect(404)
        .expect('custom-not-found')
        .end(done);
    });

    it('should turn off method-not-found handler', function(done) {
      var method = givenSharedStaticMethod();

      objects.options.rest = {handleUnknownPaths: false};
      app.use(function(req, res, next) {
        res.send(404, 'custom-not-found');
      });

      request(app).get(method.classUrl + '/thisMethodDoesNotExist')
        .expect(404)
        .expect('custom-not-found')
        .end(done);
    });

    it('should by default use defined error handler', function(done) {
      app.use(function(err, req, res, next) {
        res.send('custom-error-handler-called');
      });

      request(app).get('/thisUrlDoesNotExists/someMethod')
        .expect(404)
        .expect(function(res) {
          expect(res.text).not.to.equal('custom-error-handler-called');
        })
        .end(done);
    });

    it('should turn off error handler', function(done) {
      objects.options.rest = {handleErrors: false};
      app.use(function(err, req, res, next) {
        res.send('custom-error-handler-called');
      });

      request(app).get('/thisUrlDoesNotExists/someMethod')
        .expect(200)
        .expect('custom-error-handler-called')
        .end(done);
    });

    it('should configure custom REST content types', function(done) {
      var supportedTypes = ['json', 'application/javascript', 'text/javascript'];
      objects.options.rest = {supportedTypes: supportedTypes};

      var method = givenSharedStaticMethod(
        function(cb) {
          cb(null, {key: 'value'});
        },
        {
          returns: {arg: 'result', type: 'object'},
        }
      );

      var browserAcceptHeader = [
        'text/html',
        'application/xhtml+xml',
        'application/xml;q=0.9',
        'image/webp',
        '*/*;q=0.8',
      ].join(',');

      request(app).get(method.url)
        .set('Accept', browserAcceptHeader)
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200, done);
    });

    it('should disable XML content types by default', function(done) {
      delete objects.options.rest;

      var method = givenSharedStaticMethod(
        function(cb) { cb(null, {key: 'value'}); },
        {returns: {arg: 'result', type: 'object'}}
      );

      request(app).get(method.url)
        .set('Accept', ACCEPT_XML_OR_ANY)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(done);
    });

    it('should enable XML types via `options.rest.xml`', function(done) {
      objects.options.rest = {xml: true};

      var method = givenSharedStaticMethod(
        function(value, cb) { cb(null, {key: value}); },
        {
          accepts: {arg: 'value', type: 'string'},
          returns: {arg: 'result', type: 'object'},
        });

      request(app).post(method.url)
        .set('Accept', ACCEPT_XML_OR_ANY)
        .set('Content-Type', 'application/json')
        .send({value: 'some-value'})
        .expect(200)
        .expect('Content-Type', /xml/)
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.text.replace(/>\s+</mg, '><')).to.equal(
            '<?xml version="1.0" encoding="UTF-8"?>' +
            '<response><result><key>some-value</key></result></response>'
          );
          done();
        });
    });

    it('should enable XML via `options.rest.supportedTypes`', function(done) {
      objects.options.rest = {supportedTypes: ['application/xml']};

      var method = givenSharedStaticMethod(
        function(cb) { cb(null, 'value'); },
        {returns: {arg: 'result', type: 'object'}}
      );

      request(app).post(method.url)
        .set('Accept', ACCEPT_XML_OR_ANY)
        .expect(200)
        .expect('Content-Type', /xml/)
        .end(done);
    });

    it('should treat application/vnd.api+json accept header correctly', function(done) {
      objects.options.rest = {supportedTypes: ['application/vnd.api+json']};

      var method = givenSharedStaticMethod(
        function(cb) { cb(null, {value: 'value'}); },
        {returns: {arg: 'result', type: 'object'}}
      );

      request(app).get(method.url)
        .set('Accept', 'application/vnd.api+json')
        .expect(200)
        .expect('Content-Type', /application\/vnd\.api\+json/)
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.body).to.deep.equal({result: {value: 'value'}});
          done();
        });
    });
  });

  describe('CORS', function() {
    var method;
    beforeEach(function() {
      method = givenSharedStaticMethod(
        function greet(person, cb) {
          if (person === 'error') {
            var err = new Error('error');
            err.statusCode = 400;
            cb(err);
          } else {
            cb(null, 'hello');
          }
        },
        {
          accepts: {arg: 'person', type: 'string'},
          returns: {arg: 'msg', type: 'string'},
        }
      );
    });

    it('should reject cross-origin requests', function(done) {
      request(app).post(method.url)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .set('Origin', 'http://localhost:3001')
        .send({person: 'ABC'})
        .expect(200, function(err, res) {
          expect(Object.keys(res.headers)).to.not.include.members([
            'access-control-allow-origin',
            'access-control-allow-credentials',
          ]);
          done();
        });
    });

    it('should reject preflight (OPTIONS) requests', function(done) {
      request(app).options(method.url)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .set('Origin', 'http://localhost:3001')
        .send()
        // http://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html#sec9.2
        .expect(200, function(err, res) {
          expect(Object.keys(res.headers)).to.not.include.members([
            'access-control-allow-origin',
            'access-control-allow-credentials',
          ]);
          done();
        });
    });
  });

  function enableXmlSupport() {
    objects.options.rest = objects.options.rest || {};
    objects.options.rest.xml = true;
  }

  describe('call of constructor method', function() {
    beforeEach(enableXmlSupport);

    it('should work', function(done) {
      var method = givenSharedStaticMethod(
        function greet(msg, cb) {
          cb(null, msg);
        },
        {
          accepts: {arg: 'person', type: 'string'},
          returns: {arg: 'msg', type: 'string'},
        }
      );

      json(method.url + '?person=hello')
        .expect(200, {msg: 'hello'}, done);
    });

    it('should honor Accept: header', function(done) {
      var method = givenSharedStaticMethod(
        function greet2(msg, cb) {
          cb(null, msg);
        },
        {
          accepts: {arg: 'person', type: 'string'},
          returns: {arg: 'msg', type: 'string'},
        }
      );

      xml(method.url + '?person=hello')
        .expect(200, '<?xml version="1.0" encoding="UTF-8"?>\n<response>\n  ' +
          '<msg>hello</msg>\n</response>', done);
    });

    it('should handle returns of array', function(done) {
      var method = givenSharedStaticMethod(
        function greet3(msg, cb) {
          cb(null, [msg]);
        },
        {
          accepts: {arg: 'person', type: ['string']},
          returns: {arg: 'msg', type: 'string'},
        }
      );

      xml(method.url + '?person=["hello"]')
        .expect(200, '<?xml version="1.0" encoding="UTF-8"?>\n<response>\n  ' +
          '<msg>hello</msg>\n</response>', done);
    });

    it('should handle returns of array to XML', function(done) {
      var method = givenSharedStaticMethod(
        function greet4(msg, cb) {
          cb(null, [msg]);
        },
        {
          accepts: {arg: 'person', type: ['string']},
          returns: {arg: 'msg', type: ['string'], root: true},
        }
      );

      xml(method.url + '?person=["hello"]')
        .expect(200, '<?xml version="1.0" encoding="UTF-8"?>\n<response>\n  ' +
          '<result>hello</result>\n</response>', done);
    });

    it('should allow arguments in the path', function(done) {
      var method = givenSharedStaticMethod(
        function bar(a, b, cb) {
          cb(null, a + b);
        },
        {
          accepts: [
            {arg: 'b', type: 'number'},
            {arg: 'a', type: 'number', http: {source: 'path'}},
          ],
          returns: {arg: 'n', type: 'number'},
          http: {path: '/:a'},
        }
      );

      json(method.classUrl + '/1?b=2')
        .expect({n: 3}, done);
    });

    it('should allow arguments in the query', function(done) {
      var method = givenSharedStaticMethod(
        function bar(a, b, cb) {
          cb(null, a + b);
        },
        {
          accepts: [
            {arg: 'b', type: 'number'},
            {arg: 'a', type: 'number', http: {source: 'query'}},
          ],
          returns: {arg: 'n', type: 'number'},
          http: {path: '/'},
        }
      );

      json(method.classUrl + '/?a=1&b=2')
        .expect({n: 3}, done);
    });

    it('should allow string[] arg in the query', function(done) {
      var method = givenSharedStaticMethod(
        function bar(a, b, cb) {
          cb(null, b.join('') + a);
        },
        {
          accepts: [
            {arg: 'a', type: 'string'},
            {arg: 'b', type: ['string'], http: {source: 'query'}},
          ],
          returns: {arg: 'n', type: 'string'},
          http: {path: '/'},
        }
      );

      json(method.classUrl + '/?a=z&b[0]=x&b[1]=y')
        .expect({n: 'xyz'}, done);
    });

    it('should allow string[] arg in the query with stringified value',
      function(done) {
        var method = givenSharedStaticMethod(
        function bar(a, b, cb) {
          cb(null, b.join('') + a);
        },
          {
            accepts: [
            {arg: 'a', type: 'string'},
            {arg: 'b', type: ['string'], http: {source: 'query'}},
            ],
            returns: {arg: 'n', type: 'string'},
            http: {path: '/'},
          }
      );

        json(method.classUrl + '/?a=z&b=["x", "y"]')
        .expect({n: 'xyz'}, done);
      });

    it('should allow custom argument functions', function(done) {
      var method = givenSharedStaticMethod(
        function bar(a, b, cb) {
          cb(null, a + b);
        },
        {
          accepts: [
            {arg: 'b', type: 'number'},
            {arg: 'a', type: 'number', http: function(ctx) {
              return +ctx.req.query.a;
            }},
          ],
          returns: {arg: 'n', type: 'number'},
          http: {path: '/'},
        }
      );

      json(method.classUrl + '/?a=1&b=2')
        .expect({n: 3}, done);
    });

    it('should pass undefined if the argument is not supplied', function(done) {
      var called = false;
      var method = givenSharedStaticMethod(
        function bar(a, cb) {
          called = true;
          assert(a === undefined, 'a should be undefined');
          cb();
        },
        {
          accepts: [
            {arg: 'b', type: 'number'},
          ],
        }
      );

      json(method.url).end(function() {
        assert(called);
        done();
      });
    });

    it('should allow arguments in the body', function(done) {
      var method = givenSharedStaticMethod(
        function bar(a, cb) {
          cb(null, a);
        },
        {
          accepts: [
            {arg: 'a', type: 'object', http: {source: 'body'}},
          ],
          returns: {arg: 'data', type: 'object', root: true},
          http: {path: '/'},
        }
      );

      request(app).post(method.classUrl)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .send('{"x": 1, "y": "Y"}')
        .expect('Content-Type', /json/)
        .expect(200, function(err, res) {
          expect(res.body).to.deep.equal({'x': 1, 'y': 'Y'});
          done(err, res);
        });
    });

    it('should allow arguments in the body with date', function(done) {
      var method = givenSharedStaticMethod(
        function bar(a, cb) {
          cb(null, a);
        },
        {
          accepts: [
            {arg: 'a', type: 'object', http: {source: 'body'}},
          ],
          returns: {arg: 'data', type: 'object', root: true},
          http: {path: '/'},
        }
      );

      var data = {date: {$type: 'date', $data: new Date()}};
      request(app).post(method.classUrl)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .send(data)
        .expect('Content-Type', /json/)
        .expect(200, function(err, res) {
          expect(res.body).to.deep.equal({date: data.date.$data.toISOString()});
          done(err, res);
        });
    });

    it('should allow arguments in the form', function(done) {
      var method = givenSharedStaticMethod(
        function bar(a, b, cb) {
          cb(null, a + b);
        },
        {
          accepts: [
            {arg: 'b', type: 'number', http: {source: 'form'}},
            {arg: 'a', type: 'number', http: {source: 'form'}},
          ],
          returns: {arg: 'n', type: 'number'},
          http: {path: '/'},
        }
      );

      request(app).post(method.classUrl)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send('a=1&b=2')
        .expect('Content-Type', /json/)
        .expect({n: 3}, done);
    });

    it('should allow arguments in the header', function(done) {
      var method = givenSharedStaticMethod(
        function bar(a, b, cb) {
          cb(null, a + b);
        },
        {
          accepts: [
            {arg: 'b', type: 'number', http: {source: 'header'}},
            {arg: 'a', type: 'number', http: {source: 'header'}},
          ],
          returns: {arg: 'n', type: 'number'},
          http: {verb: 'get', path: '/'},
        }
      );

      request(app).get(method.classUrl)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .set('a', 1)
        .set('b', 2)
        .send()
        .expect('Content-Type', /json/)
        .expect({n: 3}, done);
    });

    it('should allow arguments in the header without http source',
      function(done) {
        var method = givenSharedStaticMethod(
        function bar(a, b, cb) {
          cb(null, a + b);
        },
          {
            accepts: [
            {arg: 'b', type: 'number'},
            {arg: 'a', type: 'number'},
            ],
            returns: {arg: 'n', type: 'number'},
            http: {verb: 'get', path: '/'},
          }
      );

        request(app).get(method.classUrl)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .set('a', 1)
        .set('b', 2)
        .send()
        .expect('Content-Type', /json/)
        .expect({n: 3}, done);
      });

    it('should allow arguments from http req and res', function(done) {
      var method = givenSharedStaticMethod(
        function bar(req, res, cb) {
          res.status(200).send(req.body);
        },
        {
          accepts: [
            {arg: 'req', type: 'object', http: {source: 'req'}},
            {arg: 'res', type: 'object', http: {source: 'res'}},
          ],
          http: {path: '/'},
        }
      );

      request(app).post(method.classUrl)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .send('{"x": 1, "y": "Y"}')
        .expect('Content-Type', /json/)
        .expect(200, function(err, res) {
          expect(res.body).to.deep.equal({'x': 1, 'y': 'Y'});
          done(err, res);
        });
    });

    it('should allow arguments from http context', function(done) {
      var method = givenSharedStaticMethod(
        function bar(ctx, cb) {
          ctx.res.status(200).send(ctx.req.body);
        },
        {
          accepts: [
            {arg: 'ctx', type: 'object', http: {source: 'context'}},
          ],
          http: {path: '/'},
        }
      );

      request(app).post(method.classUrl)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .send('{"x": 1, "y": "Y"}')
        .expect('Content-Type', /json/)
        .expect(200, function(err, res) {
          expect(res.body).to.deep.equal({'x': 1, 'y': 'Y'});
          done(err, res);
        });
    });

    it('should respond with 204 if returns is not defined', function(done) {
      var method = givenSharedStaticMethod(
        function(cb) { cb(null, 'value-to-ignore'); }
      );

      json(method.url)
        .expect(204, done);
    });

    it('should preserve non-200 status when responding with no content', function(done) {
      var method = givenSharedStaticMethod(
        function(ctx, cb) {
          ctx.res.status(302);
          cb();
        }, {
          accepts: [
            {
              arg: 'ctx',
              type: 'object',
              http: {
                source: 'context',
              },
            },
          ],
        });

      request(app).get(method.url)
        .set('Accept', 'application/json')
        .expect(302, done);
    });

    it('should accept custom content-type header if respond with 204', function(done) {
      var method = givenSharedStaticMethod();
      objects.before(method.name, function(ctx, next) {
        ctx.res.set('Content-Type',
          'application/json; charset=utf-8; profile=http://example.org/');
        next();
      });

      request(app).get(method.url)
        .set('Accept', 'application/json')
        .expect('Content-Type',
          'application/json; charset=utf-8; profile=http://example.org/')
        .expect(204, done);
    });

    it('should respond with named results if returns has multiple args', function(done) {
      var method = givenSharedStaticMethod(
        function(a, b, cb) {
          cb(null, a, b);
        },
        {
          accepts: [
            {arg: 'a', type: 'number'},
            {arg: 'b', type: 'number'},
          ],
          returns: [
            {arg: 'a', type: 'number'},
            {arg: 'b', type: 'number'},
          ],
        }
      );

      json(method.url + '?a=1&b=2')
        .expect({a: 1, b: 2}, done);
    });

    it('should remove any X-Powered-By header to LoopBack', function(done) {
      var method = givenSharedStaticMethod(
        function(cb) { cb(null, 'value-to-ignore'); }
      );

      json(method.url)
        .expect(204)
        .end(function(err, result) {
          expect(result.headers).not.to.have.keys(['x-powered-by']);
          done();
        });
    });

    it('should report error for mismatched arg type', function(done) {
      remotes.foo = {
        bar: function(a, fn) {
          fn(null, a);
        },
      };

      var fn = remotes.foo.bar;

      fn.shared = true;
      fn.accepts = [
        {arg: 'a', type: 'object'},
      ];
      fn.returns = {root: true};

      json('get', '/foo/bar?a=foo')
        .expect(400, done);
    });

    it('should not coerce nested boolean strings - true', function(done) {
      remotes.foo = {
        bar: function(a, fn) {
          fn(null, a);
        },
      };

      var fn = remotes.foo.bar;

      fn.shared = true;
      fn.accepts = [
        {arg: 'a', type: 'object'},
      ];
      fn.returns = {root: true};

      json('get', '/foo/bar?a[foo]=true')
        .expect({foo: 'true'}, done);
    });

    it('should not coerce nested boolean strings - false', function(done) {
      remotes.foo = {
        bar: function(a, fn) {
          fn(null, a);
        },
      };

      var fn = remotes.foo.bar;

      fn.shared = true;
      fn.accepts = [
        {arg: 'a', type: 'object'},
      ];
      fn.returns = {root: true};

      json('get', '/foo/bar?a[foo]=false')
        .expect({foo: 'false'}, done);
    });

    it('should coerce number strings', function(done) {
      remotes.foo = {
        bar: function(a, b, fn) {
          fn(null, a + b);
        },
      };

      var fn = remotes.foo.bar;

      fn.shared = true;
      fn.accepts = [
        {arg: 'a', type: 'number'},
        {arg: 'b', type: 'number'},
      ];
      fn.returns = {root: true};

      json('get', '/foo/bar?a=42&b=0.42')
        .expect(200, function(err, res) {
          assert.equal(res.body, 42.42);
          done();
        });
    });

    it('should coerce strings with type set to "any"', function(done) {
      remotes.foo = {
        bar: function(a, b, c, fn) {
          fn(null, c === true ? a + b : 0);
        },
      };

      var fn = remotes.foo.bar;

      fn.shared = true;
      fn.accepts = [
        {arg: 'a', type: 'any'},
        {arg: 'b', type: 'any'},
        {arg: 'c', type: 'any'},
      ];
      fn.returns = {root: true};

      json('get', '/foo/bar?a=42&b=0.42&c=true')
        .expect(200, function(err, res) {
          assert.equal(res.body, 42.42);
          done();
        });
    });
    describe('data type - integer', function() {
      it('should coerce integer strings', function(done) {
        remotes.foo = {
          bar: function(a, b, fn) {
            fn(null, a + b);
          },
        };

        var fn = remotes.foo.bar;

        fn.shared = true;
        fn.accepts = [
          {arg: 'a', type: 'integer'},
          {arg: 'b', type: 'integer'},
        ];
        fn.returns = {root: true};

        json('get', '/foo/bar?a=53&b=2')
          .expect(200, function(err, res) {
            assert.equal(res.body, 55);
            done();
          });
      });

      it('supports target type [integer]', function(done) {
        var method = givenSharedStaticMethod(
          function(arg, cb) {
            cb(null, {value: arg});
          },
          {
            accepts: {arg: 'arg', type: ['integer']},
            returns: {arg: 'data', type: ['integer'], root: true},
            http: {method: 'POST'},
          });

        request(app).post(method.url)
          .send({arg: [1, 2]})
          .expect(200, {value: [1, 2]})
          .end(done);
      });

      it('supports return type [integer]', function(done) {
        var method = givenSharedStaticMethod(
          function(arg, cb) {
            cb(null, [arg[0], arg[1]]);
          },
          {
            accepts: {arg: 'arg', type: ['number']},
            returns: {arg: 'data', type: ['integer']},
            http: {method: 'POST'},
          });

        request(app).post(method.url)
          .send({arg: [1, 2]})
          .expect(200, {data: [1, 2]})
          .end(done);
      });
    });

    it('should pass an array argument even when non-array passed', function(done) {
      remotes.foo = {
        bar: function(a, fn) {
          fn(null, Array.isArray(a));
        },
      };

      var fn = remotes.foo.bar;

      fn.shared = true;
      fn.accepts = [
        {arg: 'a', type: ['number']},
      ];
      fn.returns = {root: true};

      json('get',
        '/foo/bar?a=1234')
        .expect(200, function(err, res) {
          assert.equal(res.body, true);
          done();
        });
    });

    it('should coerce contents of array with simple array types', function(done) {
      remotes.foo = {
        bar: function(a, fn) {
          fn(null, a.reduce(function(memo, val) { return memo + val; }, 0));
        },
      };

      var fn = remotes.foo.bar;

      fn.shared = true;
      fn.accepts = [
        {arg: 'a', type: ['number']},
      ];
      fn.returns = {root: true};

      json('get', '/foo/bar?a=[1,2,3,4,5]')
        .expect(200, function(err, res) {
          assert.equal(res.body, 15);
          done();
        });
    });

    it('should not flatten arrays for target type "any"', function(done) {
      var method = givenSharedStaticMethod(
        function(arg, cb) { cb(null, {value: arg}); },
        {
          accepts: {arg: 'arg', type: 'any'},
          returns: {arg: 'data', type: 'any', root: true},
          http: {method: 'POST'},
        });

      request(app).post(method.url)
        .send({arg: ['single']})
        .expect(200, {value: ['single']})
        .end(done);
    });

    it('should support taget type [any]', function(done) {
      var method = givenSharedStaticMethod(
        function(arg, cb) { cb(null, {value: arg}); },
        {
          accepts: {arg: 'arg', type: ['any']},
          returns: {arg: 'data', type: ['any'], root: true},
          http: {method: 'POST'},
        });

      request(app).post(method.url)
        .send({arg: ['single']})
        .expect(200, {value: ['single']})
        .end(done);
    });

    it('should support taget type `array` - of string', function(done) {
      var method = givenSharedStaticMethod(
        function(arg, cb) { cb(null, {value: arg}); },
        {
          accepts: {arg: 'arg', type: 'array'},
          returns: {arg: 'data', type: 'array', root: true},
          http: {method: 'POST'},
        });

      request(app).post(method.url)
        .send({arg: ['single']})
        .expect(200, {value: ['single']})
        .end(done);
    });

    it('should support taget type `array` - of number', function(done) {
      var method = givenSharedStaticMethod(
        function(arg, cb) { cb(null, {value: arg}); },
        {
          accepts: {arg: 'arg', type: 'array'},
          returns: {arg: 'data', type: 'array', root: true},
          http: {method: 'POST'},
        });

      request(app).post(method.url)
        .send({arg: [1]})
        .expect(200, {value: [1]})
        .end(done);
    });

    it('should support taget type `array` - of object', function(done) {
      var method = givenSharedStaticMethod(
        function(arg, cb) { cb(null, {value: arg}); },
        {
          accepts: {arg: 'arg', type: 'array'},
          returns: {arg: 'data', type: 'array', root: true},
          http: {method: 'POST'},
        });

      request(app).post(method.url)
        .send({arg: [{foo: 'bar'}]})
        .expect(200, {value: [{foo: 'bar'}]})
        .end(done);
    });

    it('should allow empty body for json request', function(done) {
      remotes.foo = {
        bar: function(a, b, fn) {
          fn(null, a, b);
        },
      };

      var fn = remotes.foo.bar;

      fn.shared = true;
      fn.accepts = [
        {arg: 'a', type: 'number'},
        {arg: 'b', type: 'number'},
      ];

      fn.returns = [
        {arg: 'a', type: 'number'},
        {arg: 'b', type: 'number'},
      ];

      json('post', '/foo/bar?a=1&b=2').set('Content-Length', 0)
        .expect({a: 1, b: 2}, done);
    });

    it('should split array string when configured', function(done) {
      objects.options.rest = {arrayItemDelimiters: [',', '|']};
      var method = givenSharedStaticMethod(
        function(a, cb) { cb(null, a); },
        {
          accepts: {arg: 'a', type: ['number']},
          returns: {arg: 'data', type: 'object'},
        });

      json('post', method.url + '?a=1,2|3')
        .expect({data: [1, 2, 3]}, done);
    });

    it('should not create empty string array with empty string arg', function(done) {
      objects.options.rest = {arrayItemDelimiters: [',', '|']};
      var method = givenSharedStaticMethod(
        function(a, cb) { cb(null, a); },
        {
          accepts: {arg: 'a', type: ['number']},
          returns: {arg: 'data', type: 'object'},
        });

      json('post', method.url + '?a=')
        .expect({ /* data is undefined */ }, done);
    });

    it('should still support JSON arrays with arrayItemDelimiters', function(done) {
      objects.options.rest = {arrayItemDelimiters: [',', '|']};
      var method = givenSharedStaticMethod(
        function(a, cb) { cb(null, a); },
        {
          accepts: {arg: 'a', type: ['number']},
          returns: {arg: 'data', type: 'object'},
        });

      json('post', method.url + '?a=[1,2,3]')
        .expect({data: [1, 2, 3]}, done);
    });

    it('should call rest hooks', function(done) {
      var hooksCalled = [];

      var method = givenSharedStaticMethod({
        rest: {
          before: createHook('beforeRest'),
          after: createHook('afterRest'),
        },
      });

      objects.before(method.name, createHook('beforeRemote'));
      objects.after(method.name, createHook('afterRemote'));

      json(method.url)
        .end(function(err) {
          if (err) done(err);
          assert.deepEqual(
            hooksCalled,
            ['beforeRest', 'beforeRemote', 'afterRemote', 'afterRest']
          );
          done();
        });

      function createHook(name) {
        return function(ctx, next) {
          hooksCalled.push(name);
          next();
        };
      }
    });

    it('should respect supported types', function(done) {
      var method = givenSharedStaticMethod(
        function(cb) {
          cb(null, {key: 'value'});
        },
        {
          returns: {arg: 'result', type: 'object'},
        }
      );
      request(appSupportingJsonOnly).get(method.url)
        .set('Accept',
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8')
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200, done);
    });

    describe('xml support', function() {
      beforeEach(enableXmlSupport);

      it('should produce xml from json objects', function(done) {
        var method = givenSharedStaticMethod(
          function bar(a, cb) {
            cb(null, a);
          },
          {
            accepts: [
              {arg: 'a', type: 'object', http: {source: 'body'}},
            ],
            returns: {arg: 'data', type: 'object', root: true},
            http: {path: '/'},
          }
        );

        request(app).post(method.classUrl)
          .set('Accept', 'application/xml')
          .set('Content-Type', 'application/json')
          .send('{"x": 1, "y": "Y"}')
          .expect('Content-Type', /xml/)
          .expect(200, function(err, res) {
            expect(res.text).to.equal('<?xml version="1.0" encoding="UTF-8"?>\n' +
              '<response>\n  <x>1</x>\n  <y>Y</y>\n</response>');
            done(err, res);
          });
      });

      it('should produce xml from json array', function(done) {
        var method = givenSharedStaticMethod(
          function bar(cb) {
            cb(null, [1, 2, 3]);
          },
          {
            returns: {arg: 'data', type: ['number'], root: true},
            http: {path: '/', verb: 'get'},
          }
        );

        request(app).get(method.classUrl)
          .set('Accept', 'application/xml')
          .set('Content-Type', 'application/json')
          .send('{"x": 1, "y": "Y"}')
          .expect('Content-Type', /xml/)
          .expect(200, function(err, res) {
            expect(res.text).to.equal('<?xml version=\"1.0\" ' +
              'encoding=\"UTF-8\"?>\n<response>\n  <result>1</result>\n  ' +
              '<result>2</result>\n  <result>3</result>\n</response>');
            done(err, res);
          });
      });

      it('should produce xml from json objects with toJSON()', function(done) {
        var method = givenSharedStaticMethod(
          function bar(a, cb) {
            var result = a;
            a.toJSON = function() {
              return {
                foo: a.y,
                bar: a.x,
              };
            };
            cb(null, a);
          },
          {
            accepts: [
              {arg: 'a', type: 'object', http: {source: 'body'}},
            ],
            returns: {arg: 'data', type: 'object', root: true},
            http: {path: '/'},
          }
        );

        request(app).post(method.classUrl)
          .set('Accept', 'application/xml')
          .set('Content-Type', 'application/json')
          .send('{"x": 1, "y": "Y"}')
          .expect('Content-Type', /xml/)
          .expect(200, function(err, res) {
            expect(res.text).to.equal('<?xml version="1.0" encoding="UTF-8"?>\n' +
              '<response>\n  <foo>Y</foo>\n  <bar>1</bar>\n</response>');
            done(err, res);
          });
      });

      it('should produce xml from json objects with toJSON() inside an array',
        function(done) {
          var method = givenSharedStaticMethod(
          function bar(a, cb) {
            a.toJSON = function() {
              return {
                foo: a.y,
                bar: a.x,
              };
            };
            cb(null, [a, {c: 1}]);
          },
            {
              accepts: [
              {arg: 'a', type: 'object', http: {source: 'body'}},
              ],
              returns: {arg: 'data', type: 'object', root: true},
              http: {path: '/'},
            }
        );

          request(app).post(method.classUrl)
          .set('Accept', 'application/xml')
          .set('Content-Type', 'application/json')
          .send('{"x": 1, "y": "Y"}')
          .expect('Content-Type', /xml/)
          .expect(200, function(err, res) {
            expect(res.text).to.equal('<?xml version=\"1.0\" ' +
              'encoding=\"UTF-8\"?>\n<response>\n  <result>\n    ' +
              '<foo>Y</foo>\n    <bar>1</bar>\n  </result>\n  <result>\n    ' +
              '<c>1</c>\n  </result>\n</response>');
            done(err, res);
          });
        });

      it('should allow customized xml root element', function(done) {
        var method = givenSharedStaticMethod(
          function bar(cb) {
            cb(null, {a: 1, b: 2});
          },
          {
            returns: {
              arg: 'data', type: 'object', root: true,
              xml: {wrapperElement: 'foo'},
            },
            http: {path: '/'},
          }
        );
        request(app).get(method.classUrl)
          .set('Accept', 'application/xml')
          .set('Content-Type', 'application/json')
          .send()
          .expect('Content-Type', /xml/)
          .expect(200, function(err, res) {
            expect(res.text).to.equal(
              '<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n' +
              '<foo>\n  ' +
                '<a>1</a>\n  ' +
                '<b>2</b>\n' +
              '</foo>');
            done(err, res);
          });
      });

      it('should allow xml declaration to be disabled', function(done) {
        var method = givenSharedStaticMethod(
          function bar(cb) {
            cb(null, {a: 1, b: 2});
          },
          {
            returns: {
              arg: 'data', type: 'object', root: true,
              xml: {declaration: false},
            },
            http: {path: '/'},
          }
        );
        request(app).get(method.classUrl)
          .set('Accept', 'application/xml')
          .set('Content-Type', 'application/json')
          .send()
          .expect('Content-Type', /xml/)
          .expect(200, function(err, res) {
            expect(res.text).to.equal(
              '<response>\n  ' +
                '<a>1</a>\n  ' +
                '<b>2</b>\n' +
              '</response>');
            done(err, res);
          });
      });

      it('should allow string results to output as xml', function(done) {
        var method = givenSharedStaticMethod(
          function bar(cb) {
            var stringResult = 'a quick brown fox jumps over the lazy dog';
            cb(null, stringResult);
          },
          {
            returns: {
              root: true,
              xml: {wrapperElement: 'text'},
            },
            http: {path: '/'},
          }
        );
        request(app).get(method.classUrl)
          .set('Accept', 'application/xml')
          .set('Content-Type', 'application/json')
          .send()
          .expect('Content-Type', /xml/)
          .expect(200, function(err, res) {
            expect(res.text).to.equal(
              '<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n' +
              '<text>a quick brown fox jumps over the lazy dog' +
              '</text>');
            done(err, res);
          });
      });

      it('should handle UTF-8 & special & reserved characters', function(done) {
        var method = givenSharedStaticMethod(
          function bar(cb) {
            var stringA = 'foo\xC1\xE1\u0102\u03A9asd><=$~!@#$%^&*()-_=+/.,;\'"[]{}?';
            cb(null, {a: stringA});
          },
          {
            returns: {
              arg: 'data', type: 'object', root: true,
              xml: {wrapperElement: false},
            },
            http: {path: '/'},
          }
        );
        request(app).get(method.classUrl)
          .set('Accept', 'application/xml')
          .set('Content-Type', 'application/json')
          .send()
          .expect('Content-Type', /xml.*charset=utf-8/)
          .expect(200, function(err, res) {
            expect(res.text).to.equal(
            '<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n' +
            '<response>\n  ' +
              '<a>fooÁáĂΩasd&gt;&lt;=$~!@#$%^&amp;*()-_=+/.,;&apos;&quot;[]{}?</a>\n' +
            '</response>');
            done();
          });
      });

      it('should produce xml from json objects with toXML()', function(done) {
        var method = givenSharedStaticMethod(
          function bar(a, cb) {
            var result = a;
            a.toXML = function() {
              return '<?xml version="1.0" encoding="UTF-8"?>' +
                '<root><x>10</x></root>';
            };
            cb(null, a);
          },
          {
            accepts: [
              {arg: 'a', type: 'object', http: {source: 'body'}},
            ],
            returns: {arg: 'data', type: 'object', root: true},
            http: {path: '/'},
          }
        );

        request(app).post(method.classUrl)
          .set('Accept', 'application/xml')
          .set('Content-Type', 'application/json')
          .send('{"x": 1, "y": "Y"}')
          .expect('Content-Type', /xml/)
          .expect(200, function(err, res) {
            expect(res.text).to.equal('<?xml version="1.0" encoding="UTF-8"?>' +
              '<root><x>10</x></root>');
            done(err, res);
          });
      });
    });

    describe('_format support', function() {
      it('should produce xml if _format is xml', function(done) {
        var method = givenSharedStaticMethod(
          function bar(a, cb) {
            cb(null, a);
          },
          {
            accepts: [
              {arg: 'a', type: 'object', http: {source: 'body'}},
            ],
            returns: {arg: 'data', type: 'object', root: true},
            http: {path: '/'},
          }
        );

        request(app).post(method.classUrl + '?_format=xml')
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .send('{"x": 1, "y": "Y"}')
          .expect('Content-Type', /xml/)
          .expect(200, function(err, res) {
            expect(res.text).to.equal('<?xml version="1.0" encoding="UTF-8"?>\n' +
              '<response>\n  <x>1</x>\n  <y>Y</y>\n</response>');
            done(err, res);
          });
      });

      it('should produce json if _format is json', function(done) {
        var method = givenSharedStaticMethod(
          function bar(a, cb) {
            cb(null, a);
          },
          {
            accepts: [
              {arg: 'a', type: 'object', http: {source: 'body'}},
            ],
            returns: {arg: 'data', type: 'object', root: true},
            http: {path: '/'},
          }
        );

        request(app).post(method.classUrl + '?_format=json')
          .set('Accept', 'application/xml')
          .set('Content-Type', 'application/json')
          .send('{"x": 1, "y": "Y"}')
          .expect('Content-Type', /json/)
          .expect(200, function(err, res) {
            expect(res.body).to.deep.equal({x: 1, y: 'Y'});
            done(err, res);
          });
      });

      it('should return a 400 if _format array', function(done) {
        var method = givenSharedStaticMethod(
          function bar(a, cb) {
            cb(null, a);
          },
          {
            accepts: [
              {arg: 'a', type: 'object', http: {source: 'body'}},
            ],
            returns: {arg: 'data', type: 'object', root: true},
            http: {path: '/'},
          }
        );

        request(app).post(method.classUrl + '?_format=json&_format=xml')
          .set('Accept', 'application/xml')
          .set('Content-Type', 'application/json')
          .send('{"x": 1, "y": "Y"}')
          .expect(406, function(err, res) {
            console.log(err);
            done(err, res);
          });
      });
    });

    describe('uncaught errors', function() {
      it('should return 500 if an error object is thrown', function(done) {
        remotes.shouldThrow = {
          bar: function(fn) {
            throw new Error('an error');
          },
        };

        var fn = remotes.shouldThrow.bar;
        fn.shared = true;

        json('get', '/shouldThrow/bar?a=1&b=2')
          .expect(500)
          .end(expectErrorResponseContaining({message: 'an error'}, done));
      });

      it('should return 500 if an array of errors is thrown', function(done) {
        var testError = new Error('expected test error');
        var errArray = [testError, testError];

        function method(error) {
          return givenSharedStaticMethod(function(cb) {
            cb(error);
          });
        }

        request(app).get(method(testError).url)
          .set('Accept', 'application/json')
          .expect(500)
          .end(function(err, res) {
            if (err) return done(err);
            var expectedDetail = res.body.error;
            delete expectedDetail.statusCode;

            request(app).get(method(errArray).url)
              .set('Accept', 'application/json')
              .expect(500)
              .end(function(err, res) {
                if (err) return done(err);
                var error = res.body.error;
                expect(error).to.have.property('message').that.match(/multiple errors/);
                expect(error).to.include.keys('details');
                expect(error.details).to.include(expectedDetail);
                done();
              });
          });
      });

      it('should return 500 if an error string is thrown', function(done) {
        remotes.shouldThrow = {
          bar: function(fn) {
            throw 'an error';
          },
        };

        var fn = remotes.shouldThrow.bar;
        fn.shared = true;

        json('get', '/shouldThrow/bar?a=1&b=2')
          .expect(500)
          .end(expectErrorResponseContaining({message: 'an error'}, done));
      });

      it('should return 500 for unhandled errors thrown from before hooks',
        function(done) {
          var method = givenSharedStaticMethod();

          objects.before(method.name, function(ctx, next) {
            process.nextTick(next);
          });

          objects.before(method.name, function(ctx, next) {
            throw new Error('test error');
          });

          request(app).get(method.url)
            .set('Accept', 'application/json')
            .expect(500)
            .end(expectErrorResponseContaining({message: 'test error'}, done));
        });
    });

    it('should return 500 when method returns an error', function(done) {
      var method = givenSharedStaticMethod(
        function(cb) {
          cb(new Error('test-error'));
        }
      );

      // Send a plain, non-json request to make sure the error handler
      // always returns a json response.
      request(app).get(method.url)
        .expect('Content-Type', /json/)
        .expect(500)
        .end(expectErrorResponseContaining({message: 'test-error'}, done));
    });

    it('should return 500 when "before" returns an error', function(done) {
      var method = givenSharedStaticMethod();
      objects.before(method.name, function(ctx, next) {
        next(new Error('test-error'));
      });

      json(method.url)
        .expect(500)
        .end(expectErrorResponseContaining({message: 'test-error'}, done));
    });

    it('should return 500 when "after" returns an error', function(done) {
      var method = givenSharedStaticMethod();
      objects.after(method.name, function(ctx, next) {
        next(new Error('test-error'));
      });

      json(method.url)
        .expect(500)
        .end(expectErrorResponseContaining({message: 'test-error'}, done));
    });

    it('should return 400 when a required arg is missing', function(done) {
      var method = givenSharedPrototypeMethod(
        function(a, cb) {
          cb();
        },
        {
          accepts: [
            {arg: 'a', type: 'number', required: true},
          ],
        }
      );

      json(method.url)
        .expect(400, done);
    });
  });

  describe('call of static method with asynchronous hook', function() {
    beforeEach(function() {
      // This simulate the ACL hook
      objects.before('**', function(ctx, next, method) {
        process.nextTick(next);
      });
    });

    describe('uncaught errors', function() {
      it('should return 500 if an error object is thrown', function(done) {
        remotes.shouldThrow = {
          bar: function(fn) {
            throw new Error('an error');
          },
        };

        var fn = remotes.shouldThrow.bar;
        fn.shared = true;

        json('get', '/shouldThrow/bar?a=1&b=2')
          .expect(500)
          .end(expectErrorResponseContaining({message: 'an error'}, done));
      });

      it('should return 500 if an error string is thrown', function(done) {
        remotes.shouldThrow = {
          bar: function(fn) {
            throw 'an error';
          },
        };

        var fn = remotes.shouldThrow.bar;
        fn.shared = true;

        json('get', '/shouldThrow/bar?a=1&b=2')
          .expect(500)
          .end(expectErrorResponseContaining({message: 'an error'}, done));
      });
    });

    it('should return 500 when method returns an error', function(done) {
      var method = givenSharedStaticMethod(
        function(cb) {
          cb(new Error('test-error'));
        }
      );

      // Send a plain, non-json request to make sure the error handler
      // always returns a json response.
      request(app).get(method.url)
        .expect('Content-Type', /json/)
        .expect(500)
        .end(expectErrorResponseContaining({message: 'test-error'}, done));
    });
  });

  describe('call of prototype method', function() {
    it('should work', function(done) {
      var method = givenSharedPrototypeMethod(
        function greet(msg, cb) {
          cb(null, this.id + ':' + msg);
        },
        {
          accepts: {arg: 'person', type: 'string'},
          returns: {arg: 'msg', type: 'string'},
        }
      );

      json(method.getUrlForId('world') + '?person=hello')
        .expect(200, {msg: 'world:hello'}, done);
    });

    it('should have the correct scope', function(done) {
      var method = givenSharedPrototypeMethod(
        function greet(msg, cb) {
          assert.equal(this.constructor, method.ctor);
          cb(null, this.id + ':' + msg);
        },
        {
          accepts: {arg: 'person', type: 'string'},
          returns: {arg: 'msg', type: 'string'},
        }
      );

      json(method.getUrlForId('world') + '?person=hello')
        .expect(200, {msg: 'world:hello'}, done);
    });

    it('should allow arguments in the path', function(done) {
      var method = givenSharedPrototypeMethod(
        function bar(a, b, cb) {
          cb(null, this.id + ':' + (a + b));
        },
        {
          accepts: [
            {arg: 'b', type: 'number'},
            {arg: 'a', type: 'number', http: {source: 'path'}},
          ],
          returns: {arg: 'n', type: 'number'},
          http: {path: '/:a'},
        }
      );

      json(method.getClassUrlForId('sum') + '/1?b=2')
        .expect({n: 'sum:3'}, done);
    });

    it('should allow jsonp requests', function(done) {
      var method = givenSharedStaticMethod(
        function bar(a, cb) {
          cb(null, a);
        },
        {
          accepts: [
            {arg: 'a', type: 'number', http: {source: 'path'}},
          ],
          returns: {arg: 'n', type: 'number', root: true},
          errors: [],
          http: {path: '/:a'},
        }
      );

      request(app).get(method.classUrl + '/1?callback=boo')
        .set('Accept', 'application/javascript')
        .expect('Content-Type', /javascript/)
        .expect('/**/ typeof boo === \'function\' && boo(1);', done);
    });

    it('should allow jsonp requests with null response', function(done) {
      var method = givenSharedStaticMethod(
        function bar(a, cb) {
          cb(null, null);
        },
        {
          accepts: [
            {arg: 'a', type: 'number', http: {source: 'path'}},
          ],
          returns: {arg: 'n', type: 'number', root: true},
          http: {path: '/:a'},
        }
      );

      request(app).get(method.classUrl + '/1?callback=boo')
        .set('Accept', 'application/javascript')
        .expect('Content-Type', /javascript/)
        .expect('/**/ typeof boo === \'function\' && boo(null);', done);
    });

    it('should allow arguments in the query', function(done) {
      var method = givenSharedPrototypeMethod(
        function bar(a, b, cb) {
          cb(null, this.id + ':' + (a + b));
        },
        {
          accepts: [
            {arg: 'b', type: 'number'},
            {arg: 'a', type: 'number', http: {source: 'query'}},
          ],
          returns: {arg: 'n', type: 'number'},
          http: {path: '/'},
        }
      );

      json(method.getClassUrlForId('sum') + '/?b=2&a=1')
        .expect({n: 'sum:3'}, done);
    });

    it('should support methods on `/` path', function(done) {
      var method = givenSharedPrototypeMethod({
        http: {path: '/', verb: 'get'},
      });

      json('get', method.getClassUrlForId(0))
        .expect(204) // 204 No Content
        .end(done);
    });

    it('should respond with 204 if returns is not defined', function(done) {
      var method = givenSharedPrototypeMethod(
        function(cb) { cb(null, 'value-to-ignore'); }
      );

      json(method.getUrlForId('an-id'))
        .expect(204, done);
    });

    it('should respond with named results if returns has multiple args', function(done) {
      var method = givenSharedPrototypeMethod(
        function(a, b, cb) {
          cb(null, this.id, a, b);
        },
        {
          accepts: [
            {arg: 'a', type: 'number'},
            {arg: 'b', type: 'number'},
          ],
          returns: [
            {arg: 'id', type: 'any'},
            {arg: 'a', type: 'number'},
            {arg: 'b', type: 'number'},
          ],
        }
      );

      json(method.getUrlForId('an-id') + '?a=1&b=2')
        .expect({id: 'an-id', a: 1, b: 2}, done);
    });

    it('should respect supported types', function(done) {
      var method = givenSharedPrototypeMethod(
        function(cb) {
          cb(null, {key: 'value'});
        },
        {
          returns: {arg: 'result', type: 'object'},
        }
      );
      request(appSupportingJsonOnly).get(method.url)
        .set('Accept',
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8')
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200, done);
    });

    it('should return 500 when method returns an error', function(done) {
      var method = givenSharedPrototypeMethod(
        function(cb) {
          cb(new Error('test-error'));
        }
      );

      json(method.url)
        .expect(500)
        .end(expectErrorResponseContaining({message: 'test-error'}, done));
    });

    it('should return 500 when "before" returns an error', function(done) {
      var method = givenSharedPrototypeMethod();
      objects.before(method.name, function(ctx, next) {
        next(new Error('test-error'));
      });

      json(method.url)
        .expect(500)
        .end(expectErrorResponseContaining({message: 'test-error'}, done));
    });

    it('should return 500 when "after" returns an error', function(done) {
      var method = givenSharedPrototypeMethod();
      objects.after(method.name, function(ctx, next) {
        next(new Error('test-error'));
      });

      json(method.url)
        .expect(500)
        .end(expectErrorResponseContaining({message: 'test-error'}, done));
    });

    it('should resolve promise returned by a hook', function(done) {
      var method = givenSharedPrototypeMethod();
      var hooksCalled = [];
      objects.before('**', function(ctx) {
        hooksCalled.push('first');
        return Promise.resolve();
      });
      objects.before('**', function(ctx) {
        hooksCalled.push('second');
        return Promise.resolve();
      });

      json(method.url).expect(204, function(err, res) {
        if (err) return done(err);
        expect(hooksCalled).to.eql(['first', 'second']);
        return done();
      });
    });

    it('should handle rejected promise returned by a hook', function(done) {
      var testError = new Error('expected test error');
      var method = givenSharedPrototypeMethod();
      objects.after('**', function(ctx) {
        return new Promise(function(resolve, reject) {
          reject(testError);
        });
      });

      json(method.url).expect(500).end(function(err, res) {
        if (err) return done(err);
        expect(res.body)
          .to.have.deep.property('error.message', testError.message);
        done();
      });
    });

    it('should set "req.remotingContext"', function(done) {
      var method = givenSharedPrototypeMethod();
      json(method.url).end(function(err) {
        if (err) return done(err);
        expect(lastRequest)
          .to.have.deep.property('remotingContext.method.name');
        done();
      });
    });

    it('should set "remotingContext.ctorArgs"', function(done) {
      var method = givenSharedPrototypeMethod();
      json(method.getUrlForId(1234)).end(function(err) {
        if (err) return done(err);
        expect(lastRequest)
          .to.have.deep.property('remotingContext.ctorArgs.id', 1234);
        // Notice that the id was correctly coerced to a Number ^^^^
        done();
      });
    });

    it('should prioritise auth errors over sharedCtor errors', function(done) {
      var method = givenSharedPrototypeMethod();
      method.ctor._sharedCtor = function(ctx, next) {
        var err = new Error('Not Found');
        err.statusCode = 404;
        next(err);
      };

      objects.authorization = function(ctx, next) {
        var err = new Error('Not Authorized');
        err.statusCode = 401;
        next(err);
      };

      json(method.getUrlForId('instId'))
        // Verify that we return 401 Not Authorized and hide 404 Not Found
        .expect(401, done);
    });
  });

  describe('status codes', function() {
    describe('using a custom status code', function() {
      it('returns a custom status code', function(done) {
        var method = givenSharedStaticMethod(
          function fn(cb) {
            cb();
          },
          {
            http: {status: 201},
          }
        );
        json(method.url)
          .expect(201, done);
      });
      it('returns a custom error status code', function(done) {
        var method = givenSharedStaticMethod(
          function fn(cb) {
            cb(new Error('test error'));
          },
          {
            http: {status: 201, errorStatus: 508},
          }
        );
        json(method.url)
          .expect(508, done);
      });
      it('returns a custom error status code (using the err object)', function(done) {
        var method = givenSharedStaticMethod(
          function fn(cb) {
            var err = new Error('test error');
            err.status = 555;
            cb(err);
          },
          {
            http: {status: 201, errorStatus: 508},
          }
        );
        json(method.url)
          .expect(555, done);
      });
      it('returns a custom status code from a callback arg', function(done) {
        var exampleStatus = 222;
        var method = givenSharedStaticMethod(
          function fn(status, cb) {
            cb(null, status);
          },
          {
            accepts: {arg: 'status', type: 'number'},
            returns: {
              arg: 'status',
              http: {target: 'status'},
            },
          }
        );
        json(method.url + '?status=' + exampleStatus)
          .expect(exampleStatus, done);
      });
      it('returns a custom status code from a promise returned value', function(done) {
        var exampleStatus = 222;
        var sentBody = {eiste: 'ligo', kopries: true};
        var method = givenSharedStaticMethod(
          function fn() {
            return Promise.resolve([exampleStatus, sentBody]);
          },
          {
            returns: [{
              arg: 'status',
              http: {target: 'status'},
            }, {
              arg: 'result',
              root: true,
              type: 'object',
            }],
          }
        );
        json(method.url)
          .expect(exampleStatus)
          .then(function(response) {
            expect(response.body).to.deep.equal(sentBody);
            done();
          })
          .catch(done);
      });
    });
    it('returns 404 for unknown method of a shared class', function(done) {
      var classUrl = givenSharedStaticMethod().classUrl;

      json(classUrl + '/unknown-method')
        .expect(404, done);
    });

    it('returns 404 with standard JSON body for unknown URL', function(done) {
      json('/unknown-url')
        .expect(404)
        .end(expectErrorResponseContaining({statusCode: 404}, done));
    });
  });

  describe('result args as headers', function() {
    it('sets the header using the callback arg', function(done) {
      var A_STRING_VALUE = 'foobar';
      var method = givenSharedStaticMethod(
        function fn(input, cb) {
          cb(null, input, input);
        },
        {
          accepts: {arg: 'input', type: 'string'},
          returns: [
            {arg: 'value', type: 'string'},
            {arg: 'output', type: 'string', http: {target: 'header'}},
          ],
        }
      );
      json(method.url + '?input=' + A_STRING_VALUE)
        .expect(200)
        .expect('output', A_STRING_VALUE)
        .expect({value: A_STRING_VALUE})
        .end(done);
    });

    it('sets the header using the callback arg - root arg', function(done) {
      var A_STRING_VALUE = 'foobar';
      var method = givenSharedStaticMethod(
        function fn(input, cb) {
          cb(null, {value: input}, input);
        },
        {
          accepts: {arg: 'input', type: 'string'},
          returns: [
            {arg: 'value', type: 'object', root: true},
            {arg: 'output', type: 'string', http: {target: 'header'}},
          ],
        }
      );
      json(method.url + '?input=' + A_STRING_VALUE)
        .expect(200)
        .expect('output', A_STRING_VALUE)
        .expect({value: A_STRING_VALUE})
        .end(done);
    });

    it('sets the custom header using the callback arg', function(done) {
      var val = 'foobar';
      var method = givenSharedStaticMethod(
        function fn(input, cb) {
          cb(null, input);
        },
        {
          accepts: {arg: 'input', type: 'string'},
          returns: {arg: 'output', type: 'string', http: {
            target: 'header',
            header: 'X-Custom-Header',
          },
          },
        }
      );
      json(method.url + '?input=' + val)
        .expect('X-Custom-Header', val)
        .expect(200, done);
    });
  });

  describe('returns type "file"', function() {
    var METHOD_SIGNATURE = {
      returns: [
        {arg: 'body', type: 'file', root: true},
        {arg: 'Content-Type', type: 'string', http: {target: 'header'}},
      ],
    };

    it('should send back Buffer body', function(done) {
      var method = givenSharedStaticMethod(
        function(cb) { cb(null, new Buffer('some-text'), 'text/plain'); },
        METHOD_SIGNATURE);

      request(app).get(method.url)
        .expect(200)
        .expect('Content-Type', /^text\/plain/)
        .expect('some-text')
        .end(done);
    });

    it('should send back String body', function(done) {
      var method = givenSharedStaticMethod(
        function(cb) { cb(null, 'some-text', 'text/plain'); },
        METHOD_SIGNATURE);

      request(app).get(method.url)
        .expect(200)
        .expect('Content-Type', /^text\/plain/)
        .expect('some-text')
        .end(done);
    });

    it('should send back Stream body', function(done) {
      var method = givenSharedStaticMethod(
        function(cb) {
          var stream = new Readable();
          stream.push('some-text');
          stream.push(null); // EOF
          cb(null, stream, 'text/plain');
        },
        METHOD_SIGNATURE);

      request(app).get(method.url)
        .expect(200)
        .expect('Content-Type', /^text\/plain/)
        .expect('some-text')
        .end(done);
    });

    it('should fail for unsupported value type', function(done) {
      var method = givenSharedStaticMethod(
        function(cb) { cb(null, [1, 2]); },
        METHOD_SIGNATURE);

      request(app).get(method.url)
        .expect(500)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.body).to.have.property('error');
          expect(res.body.error.message).to.match(/array/);
          done();
        });
    });
  });

  it('returns correct error response body', function(done) {
    function TestError() {
      Error.captureStackTrace(this, TestError);
      this.name = 'TestError';
      this.message = 'a test error';
      this.status = 444;
      this.aCustomProperty = 'a-custom-value';
    }
    inherits(TestError, Error);

    var method = givenSharedStaticMethod(function(cb) { cb(new TestError()); });

    json(method.url)
      .expect(444)
      .end(function(err, result) {
        if (err) done(err);
        expect(result.body).to.have.keys(['error']);
        var expected = {
          name: 'TestError',
          status: 444,
          message: 'a test error',
          aCustomProperty: 'a-custom-value',
        };
        for (var prop in expected) {
          expect(result.body.error[prop], prop).to.equal(expected[prop]);
        }
        expect(result.body.error.stack, 'stack').to.contain(__filename);
        done();
      });
  });

  it('coerces array values passed to a string argument', function(done) {
    var method = givenSharedStaticMethod(
      function(arg, cb) { cb(null, arg); },
      {
        accepts: {arg: 'arg', type: 'string'},
        returns: {arg: 'arg', type: 'string'},
      });

    request(app).get(method.url + '?arg=1&arg=2')
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        expect(res.body.arg).to.eql('1,2');
        done();
      });
  });

  it('detects json type with charset definition', function(done) {
    var method = givenSharedStaticMethod(
      function(arg, cb) { cb(null, arg); },
      {
        accepts: {arg: 'arg', type: 'any', http: {source: 'form'}},
        returns: {arg: 'arg', type: 'any'},
      });

    request(app).post(method.url)
      .set('Content-Type', 'application/json;charset=UTF-8')
      .send({arg: '123'})
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        // JSON request was detected, sloppy coercion was not triggered
        expect(res.body.arg).to.equal('123');
        done();
      });
  });

  it('rejects multi-item array passed to a number argument', function(done) {
    var method = givenSharedStaticMethod(
      function(arg, cb) { cb(); },
      {accepts: {arg: 'arg', type: 'number'}});

    request(app).get(method.url + '?arg=1&arg=2')
      .expect(400)
      .end(done);
  });

  it('rejects multi-item array passed to an integer argument',
    function(done) {
      var method = givenSharedStaticMethod(
        function(arg, cb) { cb(); },
        {accepts: {arg: 'arg', type: 'integer'}});

      request(app).get(method.url + '?arg=2&arg=3')
        .expect(400)
        .end(done);
    });

  it('supports "Object" type string', function(done) {
    var method = givenSharedStaticMethod(
      function(arg, cb) { cb(); },
      {accepts: {arg: 'arg', type: 'Object'}});

    request(app)
      .get(method.url + '?arg={"x":1}')
      .expect(204)
      .end(done);
  });

  it('supports custom type string', function(done) {
    var method = givenSharedStaticMethod(
      function(arg, cb) { cb(); },
      {accepts: {arg: 'arg', type: 'Model'}});

    request(app)
      .get(method.url + '?arg={"x":1}')
      .expect(204)
      .end(done);
  });

  it('returns correct content-type in an empty XML response', function(done) {
    var method = givenSharedStaticMethod(
      function(arg, cb) { cb(); },
      {accepts: {arg: 'arg', type: 'Model'}});

    request(app)
      .get(method.url + '?arg={"x":1}&_format=xml')
      .expect(204)
      .end(function(err, res) {
        expect(res.get('Content-type')).to.match(/xml/);
        done();
      });
  });

  it('defaults content-type to application/json', function(done) {
    var method = givenSharedStaticMethod(
      function(arg, cb) { cb(); },
      {accepts: {arg: 'arg', type: 'Model'}});

    request(app)
      .get(method.url + '?arg={"x":1}')
      .expect(204)
      .end(function(err, res) {
        expect(res.get('Content-type')).to.match(/application\/json/);
        done();
      });
  });

  describe('client', function() {
    describe('call of constructor method', function() {
      it('should work', function(done) {
        var method = givenSharedStaticMethod(
          function greet(msg, cb) {
            cb(null, msg);
          },
          {
            accepts: {arg: 'person', type: 'string'},
            returns: {arg: 'msg', type: 'string'},
          }
        );

        var msg = 'hello';
        objects.invoke(method.name, [msg], function(err, resMsg) {
          if (err) return done(err);
          assert.equal(resMsg, msg);
          done();
        });
      });

      it('should allow arguments in the path', function(done) {
        var method = givenSharedStaticMethod(
          function bar(a, b, cb) {
            cb(null, a + b);
          },
          {
            accepts: [
              {arg: 'b', type: 'number'},
              {arg: 'a', type: 'number', http: {source: 'path'}},
            ],
            returns: {arg: 'n', type: 'number'},
            http: {path: '/:a'},
          }
        );

        objects.invoke(method.name, [1, 2], function(err, n) {
          if (err) return done(err);
          assert.equal(n, 3);
          done();
        });
      });

      it('should allow arguments in the query', function(done) {
        var method = givenSharedStaticMethod(
          function bar(a, b, cb) {
            cb(null, a + b);
          },
          {
            accepts: [
              {arg: 'b', type: 'number'},
              {arg: 'a', type: 'number', http: {source: 'query'}},
            ],
            returns: {arg: 'n', type: 'number'},
            http: {path: '/'},
          }
        );

        objects.invoke(method.name, [1, 2], function(err, n) {
          if (err) return done(err);
          assert.equal(n, 3);
          done();
        });
      });

      it('should pass undefined if the argument is not supplied', function(done) {
        var called = false;
        var method = givenSharedStaticMethod(
          function bar(a, cb) {
            called = true;
            assert(a === undefined, 'a should be undefined');
            cb();
          },
          {
            accepts: [
              {arg: 'b', type: 'number'},
            ],
          }
        );

        objects.invoke(method.name, [], function(err) {
          if (err) return done(err);
          assert(called);
          done();
        });
      });

      it('should allow arguments in the body', function(done) {
        var method = givenSharedStaticMethod(
          function bar(a, cb) {
            cb(null, a);
          },
          {
            accepts: [
              {arg: 'a', type: 'object', http: {source: 'body'}},
            ],
            returns: {arg: 'data', type: 'object', root: true},
            http: {path: '/'},
          }
        );

        var obj = {
          foo: 'bar',
        };

        objects.invoke(method.name, [obj], function(err, data) {
          if (err) return done(err);
          expect(obj).to.deep.equal(data);
          done();
        });
      });

      it('should allow arguments in the body with date', function(done) {
        var method = givenSharedStaticMethod(
          function bar(a, cb) {
            cb(null, a);
          },
          {
            accepts: [
              {arg: 'a', type: 'object', http: {source: 'body'}},
            ],
            returns: {arg: 'data', type: 'object', root: true},
            http: {path: '/'},
          }
        );

        var data = {date: {$type: 'date', $data: new Date()}};
        objects.invoke(method.name, [data], function(err, resData) {
          if (err) return done(err);
          expect(resData).to.deep.equal({date: data.date.$data.toISOString()});
          done();
        });
      });

      it('should allow arguments in the form', function(done) {
        var method = givenSharedStaticMethod(
          function bar(a, b, cb) {
            cb(null, a + b);
          },
          {
            accepts: [
              {arg: 'b', type: 'number', http: {source: 'form'}},
              {arg: 'a', type: 'number', http: {source: 'form'}},
            ],
            returns: {arg: 'n', type: 'number'},
            http: {path: '/'},
          }
        );

        objects.invoke(method.name, [1, 2], function(err, n) {
          if (err) return done(err);
          assert.equal(n, 3);
          done();
        });
      });

      it('should respond with correct args if returns has multiple args', function(done) {
        var method = givenSharedStaticMethod(
          function(a, b, cb) {
            cb(null, a, b);
          },
          {
            accepts: [
              {arg: 'a', type: 'number'},
              {arg: 'b', type: 'number'},
            ],
            returns: [
              {arg: 'a', type: 'number'},
              {arg: 'b', type: 'number'},
            ],
          }
        );

        objects.invoke(method.name, [1, 2], function(err, a, b) {
          if (err) return done(err);
          assert.equal(a, 1);
          assert.equal(b, 2);
          done();
        });
      });

      describe('uncaught errors', function() {
        it('should return 500 if an error object is thrown', function(done) {
          var errMsg = 'an error';
          var method = givenSharedStaticMethod(
            function(a, b, cb) {
              throw new Error(errMsg);
            }
          );

          objects.invoke(method.name, function(err) {
            assert(err instanceof Error);
            assert.equal(err.message, errMsg);
            done();
          });
        });
      });

      it('should hounour class-level normalizeHttpPath', function(done) {
        const sharedClass = givenSharedClass('TestModel', {
          normalizeHttpPath: true,
        });

        const sharedMethod = givenSharedMethodOnClass(
          sharedClass,
          'echoMessage',
          function echoMessage(cb) { cb(); },
          {isStatic: true});

        let requestUrl = 'hook not triggered';
        objects.before(sharedMethod.stringName, (ctx, next) => {
          requestUrl = ctx.req.originalUrl;
          next();
        });

        objects.invoke(sharedMethod.stringName, [], function(err, result) {
          if (err) return done(err);
          expect(requestUrl).to.equal('/test-model/echo-message');
          done();
        });
      });

      it('should hounour app-wide normalizeHttpPath', function(done) {
        const sharedClass = givenSharedClass('TestModel');

        const sharedMethod = givenSharedMethodOnClass(
          sharedClass,
          'echoMessage',
          function echoMessage(cb) { cb(); },
          {isStatic: true});

        restHandlerOptions = {normalizeHttpPath: true};
        objects.serverAdapter.options = {normalizeHttpPath: true};

        let requestUrl = 'hook not triggered';
        objects.before(sharedMethod.stringName, (ctx, next) => {
          requestUrl = ctx.req.originalUrl;
          next();
        });

        objects.invoke(sharedMethod.stringName, [], function(err, result) {
          if (err) return done(err);
          expect(requestUrl).to.equal('/test-model/echo-message');
          done();
        });
      });
    });

    describe('call of prototype method', function() {
      it('should work', function(done) {
        var method = givenSharedPrototypeMethod(
          function greet(msg, cb) {
            cb(null, this.id + ':' + msg);
          },
          {
            accepts: {arg: 'person', type: 'string'},
            returns: {arg: 'msg', type: 'string'},
          }
        );

        var msg = 'hello';
        objects.invoke(method.name, ['anId'], [msg], function(err, resMsg) {
          if (err) return done(err);
          assert.equal(resMsg, 'anId:' + msg);
          done();
        });
      });

      it('should allow arguments in the path', function(done) {
        var method = givenSharedPrototypeMethod(
          function bar(a, b, cb) {
            cb(null, Number(this.id) + a + b);
          },
          {
            accepts: [
              {arg: 'b', type: 'number'},
              {arg: 'a', type: 'number', http: {source: 'path'}},
            ],
            returns: {arg: 'n', type: 'number'},
            http: {path: '/:a'},
          }
        );

        objects.invoke(method.name, [39], [1, 2], function(err, n) {
          if (err) return done(err);
          assert.equal(n, 42);
          done();
        });
      });

      it('should allow arguments in the query', function(done) {
        var method = givenSharedPrototypeMethod(
          function bar(a, b, cb) {
            cb(null, Number(this.id) + a + b);
          },
          {
            accepts: [
              {arg: 'b', type: 'number'},
              {arg: 'a', type: 'number', http: {source: 'query'}},
            ],
            returns: {arg: 'n', type: 'number'},
            http: {path: '/'},
          }
        );

        objects.invoke(method.name, [39], [1, 2], function(err, n) {
          if (err) return done(err);
          assert.equal(n, 42);
          done();
        });
      });

      it('should pass undefined if the argument is not supplied', function(done) {
        var called = false;
        var method = givenSharedPrototypeMethod(
          function bar(a, cb) {
            called = true;
            assert(a === undefined, 'a should be undefined');
            cb();
          },
          {
            accepts: [
              {arg: 'b', type: 'number'},
            ],
          }
        );

        objects.invoke(method.name, [39], [], function(err) {
          if (err) return done(err);
          assert(called);
          done();
        });
      });

      it('should allow arguments in the body', function(done) {
        var method = givenSharedPrototypeMethod(
          function bar(a, cb) {
            cb(null, a);
          },
          {
            accepts: [
              {arg: 'a', type: 'object', http: {source: 'body'}},
            ],
            returns: {arg: 'data', type: 'object', root: true},
            http: {path: '/'},
          }
        );

        var obj = {
          foo: 'bar',
        };

        objects.invoke(method.name, [39], [obj], function(err, data) {
          if (err) return done(err);
          expect(obj).to.deep.equal(data);
          done();
        });
      });

      it('should allow arguments in the body with date', function(done) {
        var method = givenSharedPrototypeMethod(
          function bar(a, cb) {
            cb(null, a);
          },
          {
            accepts: [
              {arg: 'a', type: 'object', http: {source: 'body'}},
            ],
            returns: {arg: 'data', type: 'object', root: true},
            http: {path: '/'},
          }
        );

        var data = {date: {$type: 'date', $data: new Date()}};
        objects.invoke(method.name, [39], [data], function(err, resData) {
          if (err) return done(err);
          expect(resData).to.deep.equal({date: data.date.$data.toISOString()});
          done();
        });
      });

      it('should allow arguments in the form', function(done) {
        var method = givenSharedPrototypeMethod(
          function bar(a, b, cb) {
            cb(null, Number(this.id) + a + b);
          },
          {
            accepts: [
              {arg: 'b', type: 'number', http: {source: 'form'}},
              {arg: 'a', type: 'number', http: {source: 'form'}},
            ],
            returns: {arg: 'n', type: 'number'},
            http: {path: '/'},
          }
        );

        objects.invoke(method.name, [39], [1, 2], function(err, n) {
          if (err) return done(err);
          assert.equal(n, 42);
          done();
        });
      });

      it('should respond with correct args if returns has multiple args', function(done) {
        var method = givenSharedPrototypeMethod(
          function(a, b, cb) {
            cb(null, this.id, a, b);
          },
          {
            accepts: [
              {arg: 'a', type: 'number'},
              {arg: 'b', type: 'number'},
            ],
            returns: [
              {arg: 'id', type: 'any'},
              {arg: 'a', type: 'number'},
              {arg: 'b', type: 'number'},
            ],
          }
        );

        objects.invoke(method.name, ['39'], [1, 2], function(err, id, a, b) {
          if (err) return done(err);
          assert.equal(id, '39');
          assert.equal(a, 1);
          assert.equal(b, 2);
          done();
        });
      });

      describe('uncaught errors', function() {
        it('should return 500 if an error object is thrown', function(done) {
          var errMsg = 'an error';
          var method = givenSharedPrototypeMethod(
            function(a, b, cb) {
              throw new Error(errMsg);
            }
          );

          objects.invoke(method.name, ['39'], function(err) {
            assert(err instanceof Error);
            assert.equal(err.message, errMsg);
            done();
          });
        });
      });
    });
  });

  function givenSharedStaticMethod(fn, config) {
    if (typeof fn === 'object' && config === undefined) {
      config = fn;
      fn = null;
    }
    fn = fn || function(cb) { cb(); };

    remotes.testClass = {testMethod: fn};
    config = extend({shared: true}, config);
    extend(remotes.testClass.testMethod, config);
    return {
      name: 'testClass.testMethod',
      url: '/testClass/testMethod',
      classUrl: '/testClass',
    };
  }

  function givenSharedPrototypeMethod(fn, config) {
    if (typeof fn === 'object' && config === undefined) {
      config = fn;
      fn = undefined;
    }

    fn = fn || function(cb) { cb(); };
    remotes.testClass = factory.createSharedClass();
    remotes.testClass.prototype.testMethod = fn;
    config = extend({shared: true}, config);
    extend(remotes.testClass.prototype.testMethod, config);
    return {
      name: 'testClass.prototype.testMethod',
      getClassUrlForId: function(id) {
        return '/testClass/' + id;
      },
      getUrlForId: function(id) {
        return this.getClassUrlForId(id) + '/testMethod';
      },
      url: '/testClass/an-id/testMethod',
      ctor: remotes.testClass,
    };
  }

  function expectErrorResponseContaining(keyValues, excludedKeyValues, done) {
    if (done === undefined && typeof excludedKeyValues === 'function') {
      done = excludedKeyValues;
      excludedKeyValues = {};
    }
    return function(err, resp) {
      if (err) return done(err);
      for (var prop in keyValues) {
        expect(resp.body.error).to.have.property(prop, keyValues[prop]);
      }
      for (var i = 0, n = excludedKeyValues.length; i < n; i++) {
        expect(resp.body.error).to.not.have.property(excludedKeyValues[i]);
      }
      done();
    };
  }

  it('should skip the super class and only expose user defined remote methods',
    function(done) {
      function base() {
      }

      function foo() {
      }

      foo.bar = function() {
      };

      foo.bar.shared = true;

      inherits(foo, base);
      base.shared = true;
      foo.shared = true;

      foo.sharedCtor = function() {};

      remotes.foo = foo;

      var methodNames = [];
      var methods = objects.methods();

      for (var i = 0; i < methods.length; i++) {
        methodNames.push(methods[i].stringName);
      }

      expect(methodNames).not.to.contain('super_');
      expect(methodNames).to.contain('foo.bar');
      expect(methodNames.length).to.equal(1);
      done();
    });

  describe('afterError hook', function() {
    it('should be called when the method fails', function(done) {
      var method = givenSharedStaticMethod(function(cb) {
        cb(TEST_ERROR);
      });

      verifyErrorHookIsCalled(method, TEST_ERROR, done);
    });

    it('should be called when a "before" hook fails', function(done) {
      var method = givenSharedStaticMethod();

      objects.before(method.name, function(ctx, next) {
        next(TEST_ERROR);
      });

      verifyErrorHookIsCalled(method, TEST_ERROR, done);
    });

    it('should be called when an "after" hook fails', function(done) {
      var method = givenSharedStaticMethod();

      objects.after(method.name, function(ctx, next) {
        next(TEST_ERROR);
      });

      verifyErrorHookIsCalled(method, TEST_ERROR, done);
    });

    it('can replace the error object', function(done) {
      var method = givenSharedStaticMethod(function(cb) {
        cb(new Error(
          'error from the method, should have been shadowed by the hook'));
      });
      objects.afterError(method.name, function(ctx, next) {
        next(new Error('error from the hook'));
      });

      json(method.url)
        .expect(500)
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.body.error.message).to.equal('error from the hook');
          done();
        });
    });

    it('is not called on success', function(done) {
      var hookCalled = false;
      var method = givenSharedStaticMethod(function(cb) {
        cb();
      });

      objects.afterError(method.name, function(ctx, next) {
        hookCalled = true;
        next();
      });

      json(method.url).end(function(err) {
        if (err) return done(err);
        expect(hookCalled, 'hookCalled').to.equal(false);
        done();
      });
    });

    function verifyErrorHookIsCalled(method, expectedError, done) {
      var hookContext = 'hook not called';

      objects.afterError(method.name, function(ctx, next) {
        if (Array.isArray(hookContext)) {
          hookContext.push(ctx);
        } else if (typeof hookContext === 'object') {
          hookContext = [hookContext, ctx];
        } else {
          hookContext = ctx;
        }
        ctx.error.hookData = true;
        next();
      });

      json(method.url)
        .expect(500)
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.body.error).to.have.property('hookData', true);
          expect(hookContext).to.have.property('error', expectedError);
          done();
        });
    }
  });

  function givenSharedClass(name, options) {
    const ModelCtor = function() {};
    const sharedClass = new SharedClass('TestModel', ModelCtor, options);
    objects.addClass(sharedClass);
    return sharedClass;
  }

  function givenSharedMethodOnClass(sharedClass, methodName, fn, options) {
    const ctor = sharedClass.ctor;
    const target = options.isStatic ? ctor : ctor.prototype;
    target[methodName] = fn;

    return sharedClass.defineMethod(methodName, options);
  }
});
