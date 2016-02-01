var expect = require('chai').expect;
var express = require('express');
var RemoteObjects = require('../');
var User = require('./e2e/fixtures/user');

describe('phase handlers', function() {
  var server, remotes, clientRemotes;

  beforeEach(function setupServer(done) {
    var app = express();
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
    var url = 'http://127.0.0.1:' + server.address().port;
    clientRemotes.connect(url, 'rest');
  });

  afterEach(function teardownServer(done) {
    server.close(done);
  });

  it('has built-in phases "auth" and "invoke"', function() {
    expect(remotes.phases.getPhaseNames()).to.eql(['auth', 'invoke']);
  });

  it('invokes phases in the correct order', function(done) {
    var phasesRun = [];
    var pushNameAndNext = function(name) {
      return function(ctx, next) { phasesRun.push(name); next(); };
    };

    remotes.phases.find('auth').use(pushNameAndNext('phaseHandler-auth'));
    var invokePhase = remotes.phases.find('invoke');
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

  function invokeRemote(method, callback) {
    var args = [];
    clientRemotes.invoke(method, args, callback);
  }
});
