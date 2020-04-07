// Copyright IBM Corp. 2013,2017. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

const assert = require('assert');
const RemoteObjects = require('../');
const expect = require('chai').expect;
const SharedClass = require('../lib/shared-class');
const express = require('express');
const request = require('supertest');
const fs = require('fs');
const es = require('event-stream');
const http = require('http');
const EventSource = require('eventsource');

describe('strong-remoting', function() {
  let app, remotes, objects;

  beforeEach(function() {
    objects = RemoteObjects.create();
    remotes = objects.exports;
    app = express();
    app.disable('x-powered-by');

    app.use(function(req, res, next) {
      objects.handler('rest').apply(objects, arguments);
    });
  });

  function json(method, url) {
    return request(app)[method](url)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect(200)
      .expect('Content-Type', /json/);
  }

  function createSteam() {
    remotes.fs = fs;
    fs.createReadStream.shared = true;
    fs.createReadStream.accepts = [
      {arg: 'path', type: 'string'},
      {arg: 'encoding', type: 'string'},
    ];
    fs.createReadStream.returns = {arg: 'res', type: 'stream'};
    fs.createReadStream.http = {
      verb: 'get',
      pipe: {
        dest: 'res',
      },
    };
  }

  it('should stream the file output', function(done) {
    createSteam();
    json('get', '/fs/createReadStream?path=' + __dirname + '/data/foo.json&encoding=utf8')
      .expect({bar: 'baz'}, done);
  });

  it('should stream the file output with no compression', function(done) {
    createSteam();
    request(app)['get']('/fs/createReadStream')
      .expect('Content-Encoding', 'x-no-compression');
    done();
  });
});

describe('a function returning a ReadableStream', function() {
  const Readable = require('stream').Readable;
  const remotes = RemoteObjects.create();
  let streamClass, server, app, streamClosed;

  before(function(done) {
    const test = this;
    // NOTE: Date is intentionally excluded as it is not supported yet
    const data = test.data = [{foo: 'bar'}, 'bat', false, 0, null];
    app = express();
    server = app.listen(0, '127.0.0.1', done);
    function StreamClass() {

    }

    StreamClass.createStream = function createStream(cb) {
      cb(null, es.readArray(test.data));
    };

    StreamClass.createStreamWithError = function createStreamWithError(cb) {
      const rs = new Readable({objectMode: true});

      rs._read = function() {
        // required method
      };

      process.nextTick(function() {
        rs.emit('error', new Error('test error'));
      });
      cb(null, rs);
    };

    StreamClass.createInfiniteStream = function createStream(cb) {
      streamClosed = new Promise(resolve => {
        const rs = new Readable({
          objectMode: true,
          read: function(size) {
            setTimeout(() => this.push({foo: 'bar'}), 50);
          },
          destroy: function(size) {
            resolve(true);
          },
        });

        cb(null, rs);
      });
    };

    streamClass = new SharedClass('StreamClass', StreamClass);

    this.createStreamMethod = streamClass.defineMethod('createStream', {
      isStatic: true,
      fn: StreamClass.createStream,
      returns: [{
        arg: 'result',
        type: 'ReadableStream',
        json: true,
      }],
    });

    streamClass.defineMethod('createStreamWithError', {
      isStatic: true,
      fn: StreamClass.createStreamWithError,
      returns: [{
        arg: 'result',
        type: 'ReadableStream',
        json: true,
      }],
    });

    streamClass.defineMethod('createInfiniteStream', {
      isStatic: true,
      fn: StreamClass.createInfiniteStream,
      returns: [{
        arg: 'result',
        type: 'ReadableStream',
        json: true,
      }],
    });

    remotes.addClass(streamClass);
    app.use(remotes.handler('rest'));
  });

  before(function() {
    remotes.connect('http://127.0.0.1:' + server.address().port, 'rest');
  });

  it('should return a ReadableStream', function(done) {
    const testData = this.data;
    remotes.invoke('StreamClass.createStream', [], function(err, stream) {
      assert(stream.readable, 'must be a ReadableStream');
      const out = es.writeArray(function(err, result) {
        if (err) return done(err);
        expect(testData).to.eql(result);
        done();
      });

      stream.pipe(out);
    });
  });

  it('should include errors', function(done) {
    remotes.invoke('StreamClass.createStreamWithError', [], function(err, stream) {
      stream.on('error', function(err) {
        expect(err).instanceof(Error);
        expect(err.message).to.equal('test error');
      });

      stream.on('end', done);
    });
  });

  describe('an http client requesting a stream as JSON', function() {
    let server, port;
    before(function startTheApp(done) {
      server = app.listen(() => {
        port = server.address().port;
        done();
      });
    });

    after(function stopTheApp() {
      server.close();
    });

    it('should close server stream on client disconnect', function(done) {
      const req = http.request({
        port,
        path: '/StreamClass/createInfiniteStream',
        timeout: 100,
        headers: {
          // Content-type is important! When the client accepts
          // `text/event-stream` then all works well.
          // In this test, we verify what happens when the client accepts
          // only `application/json`.
          accept: 'application/json',
        },
      });

      req
        .on('error', done)
        .on('response', res => {
          req.abort();

          const timeout = 200;
          const timer = setTimeout(() => {
            // The stream was kept open, that's a bug
            const msg = `Server stream was not closed within ${timeout}ms ` +
              'after the connection was closed.';
            done(new Error(msg));
            // Prevent double call of the callback
            done = undefined;
          }, timeout);

          streamClosed.then(() => {
            if (!done) return;
            // The event stream was properly closed, the test has passed.
            clearTimeout(timer);
            done();
          });
        })
        .end();
    });
  });

  describe('an http client requesting a stream as an event source', function() {
    before(function(done) {
      const server = this.server = app.listen(done);
      this.port = server.address().port;
    });
    before(function() {
      const test = this;
      this.url = 'http://localhost:' + this.port;
    });

    it('should respond with an event stream', function(done) {
      const es = new EventSource(this.url + '/StreamClass/createStream');
      const testData = this.data;
      const result = [];

      es.on('data', function(e) {
        result.push(JSON.parse(e.data));
      });

      es.on('end', function() {
        expect(testData).to.eql(result);
        done();
      });
    });

    it('should respond with an event stream with errors', function(done) {
      const es = new EventSource(this.url + '/StreamClass/createStreamWithError');

      es.on('error', function(e) {
        let err;
        if (e && e.data) {
          err = JSON.parse(e.data);
        } else {
          return done(new Error('no error data!'));
        }
        expect(err.message).to.equal('test error');
        done();
      });
    });

    if ('destroy' in new Readable()) {
      it('should close server stream on client disconnect',
        function(done) {
          const es = new EventSource(this.url + '/StreamClass/createInfiniteStream');

          es.on('data', function(e) {
            es.close();
            streamClosed.then(() => done());
          });
        });
    } else {
      it('supports legacy ReadableStreams with no destroy() method',
        function(done) {
          const es = new EventSource(this.url + '/StreamClass/createInfiniteStream');

          es.on('data', function(e) {
            es.close();
            process.nextTick(done);
          });
        });
    }

    after(function() {
      this.server.close();
    });
  });
});
