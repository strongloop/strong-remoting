// Copyright IBM Corp. 2014,2017. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

const debug = require('debug')('test user');

module.exports = User;

function User() {
  debug('constructed a user: %j', this);
}

User.sharedCtor = function(id, callback) {
  const user = new User();
  user.username = 'joe';
  callback(null, user);
};
User.sharedCtor.shared = true;
User.sharedCtor.accepts = {arg: 'id', type: 'string'};
User.sharedCtor.http = [
  {path: '/:id', verb: 'get'},
  {path: '/', verb: 'get'},
];

const login = User.login = function(credentials, callback) {
  debug('login with credentials: %j', credentials);
  setTimeout(function() {
    if (!credentials.password) {
      return callback(new Error('password required'));
    }
    callback(null, {userId: 123});
  }, 0);
};
login.shared = true;
login.accepts = {arg: 'credentials', type: 'object'};
login.returns = {arg: 'session', type: 'object'};

const hasUsername = User.prototype.hasUsername = function(username, callback) {
  callback(null, username === this.username);
};

hasUsername.shared = true;
hasUsername.accepts = {arg: 'username', type: 'string'};
hasUsername.returns = {arg: 'hasUsername', type: 'boolean'};
