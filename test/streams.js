var assert = require('assert');
var RemoteObjects = require('../');
var express = require('express');
var request = require('supertest');
var fs = require('fs');

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
    objects.convert('streamopts', function(val) {
      return JSON.parse(val);
    });

    remotes.fs = fs;
    fs.createReadStream.shared = true;
    fs.createReadStream.accepts = [
      { arg: 'path', type: 'string' },
      { arg: 'opts', type: 'streamopts' }
    ];
    fs.createReadStream.returns = {arg: 'res', type: 'stream'};
    fs.createReadStream.http = {
      verb: 'get',
      // path: '/fs/createReadStream',
      pipe: {
        dest: 'res'
      }
    };

    var opts = encodeURIComponent(JSON.stringify({ encoding: 'utf8' }));
    json('get', '/fs/createReadStream?path=' + __dirname + '/data/foo.json&opts=' + opts)
      .expect({bar: 'baz'}, done);
  });
});
