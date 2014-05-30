var RemoteObjects = require('../../');
var expect = require('chai').expect;
var REMOTE_URL = 'http://localhost:3000';
var remotes = require('./fixtures/remotes');

remotes.connect(REMOTE_URL, 'rest');

describe('smoke test', function () {
  describe('remote.invoke()', function () {
    it('invokes a remote static method', function (done) {
      remotes.invoke(
        'User.login',
        [{username: 'joe', password: 'secret'}],
        function(err, session) {
          expect(err).to.not.exist;
          expect(session.userId).to.equal(123);
          done();
        }
      );
    });

    it('invokes a remote static method', function (done) {
      remotes.invoke(
        'User.logout',
        [{userId: '123'}],
        function(err, status) {
          expect(err).to.not.exist;
          expect(status).to.equal(true);
          done();
        }
      );
    });

  });
});
