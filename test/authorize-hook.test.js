var expect = require('chai').expect;
var express = require('express');
var RemoteObjects = require('../');
var User = require('./e2e/fixtures/user');
var fmt = require('util').format;
var User = require('./e2e/fixtures/user');

describe('authorization hook', function() {
  var server;
  var remotes;

  before(function setupServer(done) {
    var app = express();
    remotes = RemoteObjects.create();
    remotes.exports.User = User;
    app.use(remotes.handler('rest'));
    server = app.listen(0, '127.0.0.1', done);
  });

  after(function teardownServer(done) {
    server.close(done);
  });

  describe('given a remotes object with an authorization hook', function() {
    it('should be called when a remote method is invoked', function(done) {
      var callStack = [];
      remotes.authorization = function(ctx, next) {
        callStack.push('authorization');
        next();
      };

      remotes.before('User.login', function(ctx, next) {
        callStack.push('before');
        next();
      });

      invokeRemote(server.address().port,
        function(err, session) {
          expect(err).to.not.exist;
          expect(session.userId).to.equal(123);
          //                        vvvvvvvv - local before hook
          expect(callStack).to.eql(['before', 'authorization', 'before']);
          done();
        }
      );
    });
  });

  function invokeRemote(port, callback) {
    var url = 'http://127.0.0.1:' + port;
    var method = 'User.login';
    var args = [{username: 'joe', password: 'secret'}];

    remotes.connect(url, 'rest');
    remotes.invoke(method, args, callback);
  }
});
