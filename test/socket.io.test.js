'use strict';

var expect = require('chai').expect;
var express = require('express');
var extend = require('util')._extend;
var factory = require('./helpers/shared-objects-factory.js');
var http = require('http');
var inherits = require('util').inherits;
var io = require('socket.io-client');
var RemoteObjects = require('../');
var request = require('supertest');
var sio = require('socket.io');


describe('strong-remoting-socket.io', function() {
  var server;
  var objects;
  var remotes;
  var client;
  var adapterName = 'socket.io';
  var options = {
    io: {
      namespacePath: '/remotes',
      client: {
        transports: ['websocket'],
        'force new connection': true
      }
    }
  };

  // setup everything
  before(function() {
    objects = RemoteObjects.create(options);
    remotes = objects.exports;
  });

  before(function(done) {
    server = http.createServer();
    objects.handler(adapterName, server);
    server.listen(done);
  });

  beforeEach(function(done) {
    objects.connect('http://localhost:' + server.address().port, adapterName);
    objects.serverAdapter.connection.on('connect', done);
  });

  beforeEach(function(done) {
    var url = 'http://localhost:' + server.address().port +
      options.io.namespacePath;

    client = io.connect(url, options.io.client);
    client.on('connect', done);
  });

  afterEach(function() {
    objects.serverAdapter.connection.disconnect();
    client.disconnect();
  });

  describe('remoting options', function() {
    it('should use provided socket.io Server', function() {
      var server = http.createServer();
      var io = sio(server);
      var objects = RemoteObjects.create({
        io: {
          instance: io
        }
      });
      var handler = objects.handler(adapterName);

      expect(handler.server).to.equal(io);
      expect(handler.name).to.equal('/remotes');
    });
  });

  describe('error handling', function() {
    it('returns error for unknown method', function(done) {
      var error = {
        status: 404
      };

      invoke('unknown.method', [], expectErrorResponseContaining(error, done));
    });

    it('returns error if error object is passed', function(done) {
      var errMsg = 'an error';
      var error = {
        message: errMsg,
        status: 500
      };
      var method = givenSharedStaticMethod(
        function(cb) {
          cb(new Error(errMsg));
        }
      );

      invoke(method.name, [], expectErrorResponseContaining(error, done));
    });

    it('returns error if error string is passed', function(done) {
      var errMsg = 'an error';
      var error = {
        message: errMsg,
        status: 500
      };
      var method = givenSharedStaticMethod(
        function(cb) {
          cb(errMsg);
        }
      );

      invoke(method.name, [], expectErrorResponseContaining(error, done));
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
            accepts: { arg: 'person', type: 'string' },
            returns: { arg: 'msg', type: 'string' }
          }
        );

        var msg = 'hello';
        objects.invoke(method.name, [msg], function(err, res) {
          expect(res).to.equal(msg);
          done();
        });
      });

      it('should pass undefined if the argument is not supplied', function (done) {
        var called = false;
        var method = givenSharedStaticMethod(
          function bar(a, cb) {
            called = true;
            expect(a).to.be.undefined;
            cb();
          },
          {
            accepts: [
              { arg: 'b', type: 'number' }
            ]
          }
        );

        objects.invoke(method.name, [], function(err) {
          expect(called).to.be.true;
          done();
        });
      });

      it('should allow arguments with date', function(done) {
        var method = givenSharedStaticMethod(
          function bar(a, cb) {
            cb(null, a);
          },
          {
            accepts: [
              { arg: 'a', type: 'object', http: {source: 'body' }  }
            ],
            returns: { arg: 'data', type: 'object', root: true },
            http: { path: '/' }
          }
        );

        var data = {date: {$type: 'date', $data: new Date()}};
        objects.invoke(method.name, [data], function(err, resData) {
          expect(resData).to.deep.equal({date: data.date.$data.toISOString()});
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
              { arg: 'a', type: 'number' },
              { arg: 'b', type: 'number' }
            ],
            returns: [
              { arg: 'a', type: 'number' },
              { arg: 'b', type: 'number' }
            ]
          }
        );

        objects.invoke(method.name, [1, 2], function(err, a, b) {
          expect(a).to.equal(1);
          expect(b).to.equal(2);
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
            accepts: { arg: 'person', type: 'string' },
            returns: { arg: 'msg', type: 'string' }
          }
        );

        var id = 'world';
        var msg = 'hello';
        var output = [id, msg].join(':');
        objects.invoke(method.name, [id], [msg], function(err, res) {
          expect(res).to.equal(output);
          done();
        });
      });
    });
  });

  describe('call of constructor method', function() {
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

      var msg = 'hello';
      invoke(method.name, {person: msg}, function(err, res) {
        expect(res).to.deep.equal({msg: msg});
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
          accepts: { arg: 'person', type: 'string' },
          returns: { arg: 'msg', type: 'string' }
        }
      );

      var id = 'world';
      var msg = 'hello';
      var output = [id, msg].join(':');
      invoke(method.name, {id: 'world', person: msg}, function(err, res) {
        expect(res).to.deep.equal({msg: output});
        done();
      });
    });
  });

  function givenSharedStaticMethod(fn, config) {
    if (typeof fn === 'object' && config === undefined) {
      config = fn;
      fn = null;
    }
    fn = fn || function(cb) { cb(); };

    remotes.testClass = { testMethod: fn };
    config = extend({ shared: true }, config);
    extend(remotes.testClass.testMethod, config);
    return {
      name: 'testClass.testMethod'
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
    config = extend({ shared: true }, config);
    extend(remotes.testClass.prototype.testMethod, config);
    return {
      name: 'testClass.prototype.testMethod'
    };
  }

  function expectErrorResponseContaining(keyValues, done) {
    return function(err) {
      for (var prop in keyValues) {
        expect(err).to.have.property(prop, keyValues[prop]);
      }
      done();
    }
  }

  function invoke(methodString, args, fn) {
    client.emit('invoke', methodString, args, fn);
  }
});
