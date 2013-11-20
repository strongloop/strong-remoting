var extend = require('util')._extend;
var RemoteObjects = require('../');
var express = require('express');
var request = require('supertest');


describe('strong-remoting-rest', function(){
  var app;
  var objects;
  var remotes;

  // setup
  beforeEach(function(){
    objects = RemoteObjects.create();
    remotes = objects.exports;
    app = express();

    app.use(function (req, res, next) {
      // create the handler for each request
      objects.handler('rest').apply(objects, arguments);
    });
  });

  function json(method, url) {
    if (url === undefined) {
      url = method;
      method = 'get';
    }

    return request(app)[method](url)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect(200)
      .expect('Content-Type', /json/);
  }

  describe('call of constructor method', function(){
    it('should work', function(done) {
      var method = givenSharedStaticMethod(
        function greet(msg, cb) {
          cb(null, msg);
        },
        {
          accepts: { arg: 'person', type: 'string' },
          returns: { arg: 'msg', type: 'string' }
        }
      );

      json(method.url + '?person=hello')
        .expect(200, { msg: 'hello' }, done);
    });

    it('should allow arguments in the url', function(done) {
      var method = givenSharedStaticMethod(
        function bar(a, b, cb) {
          cb(null, a + b);
        },
        {
          accepts: [
            { arg: 'b', type: 'number' },
            { arg: 'a', type: 'number', http: {source: 'query' } }
          ],
          returns: { arg: 'n', type: 'number' },
          http: { path: '/:a' }
        }
      );

      json(method.classUrl +'/1?b=2')
        .expect({ n: 3 }, done);
    });

    it('should respond with 204 if returns is not defined', function(done) {
      var method = givenSharedStaticMethod(
        function(cb) { cb(null, 'value-to-ignore'); }
      );

      json(method.url)
        .expect(204, done);
    });

    it('should respond with named results if returns has multiple args', function(done) {
      var method = givenSharedStaticMethod(
        function(a, b, cb) {
          cb(null, a, b);
        },
        {
          accepts: [
            { arg: 'a', type: 'number' },
            { arg: 'b', type: 'number' }
          ],
          returns: [
            { arg: 'a', type: 'number' },
            { arg: 'b', type: 'number' }
          ]
        }
      );

      json(method.url + '?a=1&b=2')
        .expect({a: 1, b: 2}, done);
    });

    it('should coerce boolean strings - true', function(done) {
      remotes.foo = {
        bar: function (a, fn) {
          fn(null, a);
        }
      };

      var fn = remotes.foo.bar;

      fn.shared = true;
      fn.accepts = [
        {arg: 'a', type: 'object'},
      ];
      fn.returns = {root: true};

      json('get', '/foo/bar?a[foo]=true')
        .expect({foo: true}, done);
    });

    it('should coerce boolean strings - false', function(done) {
      remotes.foo = {
        bar: function (a, fn) {
          fn(null, a);
        }
      };

      var fn = remotes.foo.bar;

      fn.shared = true;
      fn.accepts = [
        {arg: 'a', type: 'object'},
      ];
      fn.returns = {root: true};

      json('get', '/foo/bar?a[foo]=false')
        .expect({foo: false}, done);
    });

    it('should coerce number strings', function(done) {
      remotes.foo = {
        bar: function (a, b, fn) {
          fn(null, a + b);
        }
      };

      var fn = remotes.foo.bar;

      fn.shared = true;
      fn.accepts = [
        {arg: 'a', type: 'number'},
        {arg: 'b', type: 'number'}
      ];
      fn.returns = {root: true};

      json('get', '/foo/bar?a=42&b=0.42')
        .expect(200, function (err, res) {
          assert.equal(res.body, 42.42);
          done();
        });
    });

    it('should allow empty body for json request', function(done) {
      remotes.foo = {
        bar: function (a, b, fn) {
          fn(null, a, b);
        }
      };

      var fn = remotes.foo.bar;

      fn.shared = true;
      fn.accepts = [
        {arg: 'a', type: 'number'},
        {arg: 'b', type: 'number'}
      ];

      fn.returns = [
        {arg: 'a', type: 'number'},
        {arg: 'b', type: 'number'}
      ];

      json('post', '/foo/bar?a=1&b=2').set('Content-Length', 0)
        .expect({a: 1, b: 2}, done);
    });

    describe('uncaught errors', function () {
      it('should return 500 if an error object is thrown', function (done) {
        remotes.shouldThrow = {
          bar: function (fn) {
            throw new Error('an error');
            fn(null);
          }
        };

        var fn = remotes.shouldThrow.bar;
        fn.shared = true;

        json('get', '/shouldThrow/bar?a=1&b=2')
          .expect(500)
          .expect({error: 'an error'})
          .end(done);
      });

      it('should return 500 if an error string is thrown', function (done) {
        remotes.shouldThrow = {
          bar: function (fn) {
            throw 'an error';
            fn(null);
          }
        };

        var fn = remotes.shouldThrow.bar;
        fn.shared = true;

        json('get', '/shouldThrow/bar?a=1&b=2')
          .expect(500)
          .expect({error: 'an error'})
          .end(done);
      });
    });

    it('should return 500 when method returns an error', function(done) {
      var method = givenSharedStaticMethod(
        function(cb) {
          cb(new Error('test-error'));
        }
      );

      json(method.url)
        .expect(500, { error: 'test-error' })
        .end(done);
    });

    it('should return 500 when "before" returns an error', function(done) {
      var method = givenSharedStaticMethod();
      objects.before(method.name, function(ctx, next) {
        next(new Error('test-error'));
      });

      json(method.url)
        .expect(500, { error: 'test-error' })
        .end(done);
    });

    it('should return 500 when "after" returns an error', function(done) {
      var method = givenSharedStaticMethod();
      objects.after(method.name, function(ctx, next) {
        next(new Error('test-error'));
      });

      json(method.url)
        .expect(500, { error: 'test-error' })
        .end(done);
    });
  });

  describe('call of prototype method', function(){
    it('should work', function(done) {
      var method = givenSharedPrototypeMethod(
        function greet(msg, cb) {
          cb(null, this.id + ':' + msg);
        },
        {
          accepts: { arg: 'person', type: 'string' },
          returns: { arg: 'msg', type: 'string' }
        }
      );

      json(method.getUrlForId('world') + '?person=hello')
        .expect(200, { msg: 'world:hello' }, done);
    });

    it('should allow arguments in the url', function(done) {
      var method = givenSharedPrototypeMethod(
        function bar(a, b, cb) {
          cb(null, this.id + ':' + (a + b));
        },
        {
          accepts: [
            { arg: 'b', type: 'number' },
            { arg: 'a', type: 'number', http: {source: 'query' } }
          ],
          returns: { arg: 'n', type: 'number' },
          http: { path: '/:a' }
        }
      );

      json(method.getClassUrlForId('sum') +'/1?b=2')
        .expect({ n: 'sum:3' }, done);
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
            { arg: 'a', type: 'number' },
            { arg: 'b', type: 'number' }
          ],
          returns: [
            { arg: 'id', type: 'any' },
            { arg: 'a', type: 'number' },
            { arg: 'b', type: 'number' }
          ]
        }
      );

      json(method.getUrlForId('an-id') + '?a=1&b=2')
        .expect({ id: 'an-id', a: 1, b: 2 }, done);
    });

    it('should return 500 when method returns an error', function(done) {
      var method = givenSharedPrototypeMethod(
        function(cb) {
          cb(new Error('test-error'));
        }
      );

      json(method.url)
        .expect(500, { error: 'test-error' })
        .end(done);
    });

    it('should return 500 when "before" returns an error', function(done) {
      var method = givenSharedPrototypeMethod();
      objects.before(method.name, function(ctx, next) {
        next(new Error('test-error'));
      });

      json(method.url)
        .expect(500, { error: 'test-error' })
        .end(done);
    });

    it('should return 500 when "after" returns an error', function(done) {
      var method = givenSharedPrototypeMethod();
      objects.after(method.name, function(ctx, next) {
        next(new Error('test-error'));
      });

      json(method.url)
        .expect(500, { error: 'test-error' })
        .end(done);
    });
  });

  function givenSharedStaticMethod(fn, config) {
    fn = fn || function(cb) { cb(); };
    remotes.testClass = { testMethod: fn };
    config = extend({ shared: true }, config);
    extend(remotes.testClass.testMethod, config);
    return {
      name: 'testClass.testMethod',
      url: '/testClass/testMethod',
      classUrl: '/testClass'
    };
  }

  function givenSharedPrototypeMethod(fn, config) {
    fn = fn || function(cb) { cb(); };
    remotes.testClass = createSharedClass();
    remotes.testClass.prototype.testMethod = fn;
    config = extend({ shared: true }, config);
    extend(remotes.testClass.prototype.testMethod, config);
    return {
      name: 'testClass.prototype.testMethod',
      getClassUrlForId: function(id) {
        return '/testClass/' + id;
      },
      getUrlForId: function(id) {
        return this.getClassUrlForId(id) + '/testMethod';
      },
      url: '/testClass/an-id/testMethod'
    };
  }

  function createSharedClass() {
    var SharedClass = function(id) {
      this.id = id;
    };

    SharedClass.shared = true;

    SharedClass.sharedCtor = function(id, cb) {
      cb(null, new SharedClass(id));
    };

    extend(SharedClass.sharedCtor, {
      shared: true,
      accepts: [ { arg: 'id', type: 'any', http: { source: 'path' }}],
      http: { path: '/:id' },
      returns: { root: true }
    });

    return SharedClass;
  }
});
