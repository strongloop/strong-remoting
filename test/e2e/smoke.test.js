// Copyright IBM Corp. 2014,2017. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

const RemoteObjects = require('../../');
const expect = require('chai').expect;
const REMOTE_URL = 'http://localhost:3000';
const remotes = require('./fixtures/remotes');

remotes.connect(REMOTE_URL, 'rest');

describe('smoke test', function() {
  describe('remote.invoke()', function() {
    it('invokes a remote static method', function(done) {
      remotes.invoke(
        'User.login',
        [{username: 'joe', password: 'secret'}],
        function(err, session) {
          expect(err).to.not.exist();
          expect(session.userId).to.equal(123);
          done();
        },
      );
    });
  });
});
