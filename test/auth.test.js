var auth = require('http-auth');
var crypto = require('crypto');
var expect = require('chai').expect;
var express = require('express');
var fmt = require('util').format;

var RemoteObjects = require('../');
var User = require('./e2e/fixtures/user');

describe('support for HTTP Authentication', function() {
  var server;
  var remotes = RemoteObjects.create();
  remotes.exports.User = User;

  before(function setupServer(done) {
    var app = express();
    var basic = auth.basic({ realm: 'testing' }, function(u, p, cb) {
      cb(u === 'basicuser' && p === 'basicpass');
    });
    var digest = auth.digest({ realm: 'testing' }, function(user, cb) {
      cb(user === 'digestuser' ? md5('digestuser:testing:digestpass') : null);
    });
    app.use('/noAuth', remotes.handler('rest'));
    app.use('/basicAuth', auth.connect(basic), remotes.handler('rest'));
    app.use('/digestAuth', auth.connect(digest), remotes.handler('rest'));
    server = app.listen(0, '127.0.0.1', done);
  });

  after(function teardownServer(done) {
    server.close(done);
  });

  describe('when no authentication is required', function() {
    it('succeeds without credentials',
       succeeds('/noAuth'));
    it('succeeds with credentials',
       succeeds('/noAuth', 'extrauser:extrapass'));
  });

  describe('when Basic auth is required', function() {
    it('succeeds with correct credentials',
       succeeds('/basicAuth', 'basicuser:basicpass'));
    it('fails when bad credentials are given',
       fails('/basicAuth', 'baduser:badpass'));
    it('fails when no credentials are given',
       fails('/basicAuth'));
  });

  describe('when Digest auth is required', function() {
    it('succeeds with correct credentials',
       succeeds('/digestAuth', 'digestuser:digestpass'));
    it('fails with bad credentials',
       fails('/digestAuth', 'baduser:badpass'));
    it('fails with no credentials',
       fails('/digestAuth'));
  });

  function succeeds(path, credentials) {
    return function(done) {
      invokeRemote(server.address().port, path, credentials,
                   function(err, session) {
                     expect(err).to.not.exist();
                     expect(session.userId).to.equal(123);
                     done();
                   });
    };
  }

  function fails(path, credentials) {
    return function(done) {
      invokeRemote(server.address().port, path, credentials,
                   function(err, session) {
                     expect(err).to.match(/401/);
                     done();
                   });
    };
  }

  function invokeRemote(port, path, credentials, callback) {
    credentials = credentials || '';
    if (credentials.length > 0) {
      credentials += '@';
    }
    var url = fmt('http://%s127.0.0.1:%d%s', credentials, port, path);
    var method = 'User.login';
    var args = [{username: 'joe', password: 'secret'}];
    remotes.connect(url, 'rest');
    remotes.invoke(method, args, callback);
  }
});

function md5(str) {
  var hash = crypto.createHash('md5');
  hash.update(str);
  return hash.digest('hex');
}
