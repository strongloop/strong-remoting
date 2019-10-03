// Copyright IBM Corp. 2015,2017. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

const auth = require('http-auth');
const crypto = require('crypto');
const expect = require('./helpers/expect');
const express = require('express');
const fmt = require('util').format;

const RemoteObjects = require('../');
const User = require('./e2e/fixtures/user');

describe('support for HTTP Authentication', function() {
  let server;
  const remotes = RemoteObjects.create();
  remotes.exports.User = User;

  before(function setupServer(done) {
    const app = express();
    const basic = auth.basic({realm: 'testing'}, function(u, p, cb) {
      cb(u === 'basicuser' && p === 'basicpass');
    });
    const digest = auth.digest({realm: 'testing'}, function(user, cb) {
      cb(user === 'digestuser' ? md5('digestuser:testing:digestpass') : null);
    });
    app.use('/noAuth', remotes.handler('rest'));
    app.use('/basicAuth', auth.connect(basic), remotes.handler('rest'));
    app.use('/digestAuth', auth.connect(digest), remotes.handler('rest'));
    app.use('/bearerAuth', bearerMiddleware('bearertoken'), remotes.handler('rest'));
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

  describe('when Bearer auth is required', function() {
    it('succeeds with correct credentials',
      succeeds('/bearerAuth', {bearer: 'bearertoken'}));
    it('fails with bad credentials',
      fails('/bearerAuth', {bearer: 'badtoken'}));
    it('fails with no credentials',
      fails('/bearerAuth'));
  });

  describe('remotes.auth', function() {
    it('should be populated from the url', function() {
      const url = 'http://login:pass@myhost.com';
      remotes.connect(url, 'rest');
      expect(remotes.auth.username).to.eql('login');
      expect(remotes.auth.password).to.eql('pass');
    });
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
    let auth, split;

    if (typeof credentials === 'string') {
      split = credentials && credentials.split(':');
      if (split && split.length === 2) {
        auth = {
          username: split[0],
          password: split[1],
        };
      }
    } else if (credentials && typeof credentials === 'object') {
      auth = credentials;
    }

    const url = fmt('http://127.0.0.1:%d%s', port, path);
    const method = 'User.login';
    const args = [{username: 'joe', password: 'secret'}];
    remotes.connect(url, 'rest');
    remotes.auth = auth;
    remotes.invoke(method, args, callback);
  }
});

function md5(str) {
  const hash = crypto.createHash('md5');
  hash.update(str);
  return hash.digest('hex');
}

function bearerMiddleware(token) {
  return function(req, res, next) {
    const authorization = req.headers.authorization;
    const AUTH_METHOD = 'Bearer';
    const providedAuthMethodIsBearer = authorization &&
        authorization.indexOf(AUTH_METHOD) === 0;
    const providedToken = authorization &&
      authorization.substr((AUTH_METHOD + ' ').length);

    if (!authorization || !providedAuthMethodIsBearer) {
      res.status(401).set('WWW-Authenticate', AUTH_METHOD).end();
      return;
    }

    if (providedToken === token) {
      return next();
    }

    res.status(401).end();
  };
}
