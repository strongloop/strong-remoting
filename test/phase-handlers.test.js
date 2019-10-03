// Copyright IBM Corp. 2016,2017. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

const expect = require('chai').expect;
const express = require('express');
const RemoteObjects = require('../');
const User = require('./e2e/fixtures/user');

describe('phase handlers', function() {
  let server, remotes, clientRemotes;

  beforeEach(function setupServer(done) {
    const app = express();
    remotes = RemoteObjects.create();
    remotes.exports.User = User;
    app.use(function(req, res, next) {
      // always build a new handler to pick new methods added by tests
      remotes.handler('rest')(req, res, next);
    });
    server = app.listen(0, '127.0.0.1', done);
  });

  beforeEach(function setupClient() {
    clientRemotes = RemoteObjects.create();
    clientRemotes.exports.User = User;
    const url = 'http://127.0.0.1:' + server.address().port;
    clientRemotes.connect(url, 'rest');
  });

  afterEach(function teardownServer(done) {
    server.close(done);
  });

  it('has built-in phases "auth" and "invoke"', function() {
    expect(remotes.phases.getPhaseNames()).to.eql(['auth', 'invoke']);
  });

  it('invokes phases in the correct order', function(done) {
    const phasesRun = [];
    const pushNameAndNext = function(name) {
      return function(ctx, next) { phasesRun.push(name); next(); };
    };

    remotes.phases.find('auth').use(pushNameAndNext('phaseHandler-auth'));
    const invokePhase = remotes.phases.find('invoke');
    invokePhase.before(pushNameAndNext('phaseHandler-invoke:before'));
    invokePhase.use(pushNameAndNext('phaseHandler-invoke:use'));
    invokePhase.after(pushNameAndNext('phaseHandler-invoke:after'));

    remotes.authorization = pushNameAndNext('hook-authorization');
    remotes.before('**', pushNameAndNext('hook-remotes.before'));
    remotes.after('**', pushNameAndNext('hook-remotes.after'));

    User.pushName = function(cb) { phasesRun.push('invoke method'); cb(); };
    User.pushName.shared = true;

    invokeRemote('User.pushName', function(err) {
      if (err) return done(err);
      expect(phasesRun).to.eql([
        'hook-authorization',
        'phaseHandler-auth',
        'hook-remotes.before',
        'phaseHandler-invoke:before',
        'invoke method',
        'phaseHandler-invoke:use',
        'hook-remotes.after',
        'phaseHandler-invoke:after',
      ]);
      done();
    });
  });

  describe('registerPhaseHandler', function() {
    let handlersRun;

    beforeEach(function() {
      User.static = function(cb) { cb(); };
      User.static.shared = true;

      User.prototype.proto = function(cb) { cb(); };
      User.prototype.proto.shared = true;

      handlersRun = [];
      function register(wildcard) {
        remotes.registerPhaseHandler('invoke', wildcard, function(ctx, next) {
          handlersRun.push(wildcard);
          next();
        });
      }

      register('**');
      register('User.**');

      register('User.*');
      register('User.static');
      register('User.proto'); // does not exist

      register('User.prototype.*');
      register('User.prototype.proto');
      register('User.prototype.static'); // does not exist
    });

    it('matches static methods using wildcards', function(done) {
      invokeRemote('User.static', function(err) {
        if (err) return done(err);
        expect(handlersRun).to.eql([
          '**',
          'User.**',
          'User.*',
          'User.static',
        ]);
        done();
      });
    });

    it('matches prototype methods using wildcards', function(done) {
      invokeRemote('User.prototype.proto', function(err) {
        if (err) return done(err);
        expect(handlersRun).to.eql([
          '**',
          'User.**',
          'User.prototype.*',
          'User.prototype.proto',
        ]);
        done();
      });
    });
  });

  function invokeRemote(method, callback) {
    const args = [];
    clientRemotes.invoke(method, args, callback);
  }
});
