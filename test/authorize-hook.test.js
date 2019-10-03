// Copyright IBM Corp. 2015,2018. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

const expect = require('./helpers/expect');
const express = require('express');
const RemoteObjects = require('../');
const User = require('./e2e/fixtures/user');
const fmt = require('util').format;

describe('authorization hook', function() {
  let server, remotes;

  before(function setupServer(done) {
    const app = express();
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
      const callStack = [];
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
          expect(err).to.not.exist();
          expect(session.userId).to.equal(123);
          //                        vvvvvvvv - local before hook
          expect(callStack).to.eql(['before', 'authorization', 'before']);
          done();
        });
    });
  });

  function invokeRemote(port, callback) {
    const url = 'http://127.0.0.1:' + port;
    const method = 'User.login';
    const args = [{username: 'joe', password: 'secret'}];

    remotes.connect(url, 'rest');
    remotes.invoke(method, args, callback);
  }
});
