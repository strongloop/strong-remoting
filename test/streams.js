var assert = require('assert');
var RemoteObjects = require('../');
var expect = require('chai').expect;
var SharedClass = require('../lib/shared-class');
var express = require('express');
var request = require('supertest');
var fs = require('fs');
var es = require('event-stream');
var EventSource = require('eventsource');

describe('strong-remoting', function() {
  var app;
  var remotes;
  var objects;

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

  it('should stream the file output', function(done) {
    remotes.fs = fs;
    fs.createReadStream.shared = true;
    fs.createReadStream.accepts = [
      { arg: 'path', type: 'string' },
      { arg: 'encoding', type: 'string' }
    ];
    fs.createReadStream.returns = {arg: 'res', type: 'stream'};
    fs.createReadStream.http = {
      verb: 'get',
      // path: '/fs/createReadStream',
      pipe: {
        dest: 'res'
      }
    };

    json('get', '/fs/createReadStream?path=' + __dirname + '/data/foo.json&encoding=utf8')
      .expect({bar: 'baz'}, done);
  });
});

describe('a function returning a ReadableStream', function() {
  var Readable = require('stream').Readable;
  var remotes = RemoteObjects.create();
  var streamClass;
  var server;
  var app;

  before(function(done) {
    var test = this;
    // NOTE: Date is intentionally excluded as it is not supported yet
    var data = test.data = [{foo: 'bar'}, 'bat', false, 0, null];
    app = express();
    server = app.listen(0, '127.0.0.1', done);
    function StreamClass() {

    }

    StreamClass.createStream = function createStream(cb) {
      cb(null, es.readArray(test.data));
    };

    StreamClass.createStreamWithError = function createStreamWithError(cb) {
      var rs = new Readable({objectMode: true});

      rs._read = function() {
        // required method
      };

      process.nextTick(function() {
        rs.emit('error', new Error('test error'));
      });
      cb(null, rs);
    };

    streamClass = new SharedClass('StreamClass', StreamClass);

    this.createStreamMethod = streamClass.defineMethod('createStream', {
      isStatic: true,
      fn: StreamClass.createStream,
      returns: [{
        arg: 'result',
        type: 'ReadableStream',
        json: true
      }]
    });

    streamClass.defineMethod('createStreamWithError', {
      isStatic: true,
      fn: StreamClass.createStreamWithError,
      returns: [{
        arg: 'result',
        type: 'ReadableStream',
        json: true
      }]
    });

    remotes.addClass(streamClass);
    app.use(remotes.handler('rest'));
  });

  before(function() {
    remotes.connect('http://127.0.0.1:' + server.address().port, 'rest');
  });

  it('should return a ReadableStream', function(done) {
    var testData = this.data;
    remotes.invoke('StreamClass.createStream', [], function(err, stream) {
      assert(stream.readable, 'must be a ReadableStream');
      var out = es.writeArray(function(err, result) {
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

  describe('an http client requesting a stream as an event source', function() {
    before(function(done) {
      var server = this.server = app.listen(done);
      this.port = server.address().port;
    });
    before(function() {
      var test = this;
      this.url = 'http://localhost:' + this.port;
    });

    it('should respond with an event stream', function(done) {
      var es = new EventSource(this.url + '/StreamClass/createStream');
      var testData = this.data;
      var result = [];

      es.on('data', function(e) {
        result.push(JSON.parse(e.data));
      });

      es.on('end', function() {
        expect(testData).to.eql(result);
        done();
      });
    });

    it('should respond with an event stream with errors', function(done) {
      var es = new EventSource(this.url + '/StreamClass/createStreamWithError');

      es.on('error', function(e) {
        var err;
        if (e && e.data) {
          err = JSON.parse(e.data);
        } else {
          return done(new Error('no error data!'));
        }
        expect(err.message).to.equal('test error');
        done();
      });
    });

    after(function() {
      this.server.close();
    });
  });
});
