// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var expect = require('chai').expect;
var RemoteObjects = require('../');
var RestAdapter = require('../lib/rest-adapter');

describe('RemoteObjects', function() {
  var remotes;
  beforeEach(function() { remotes = RemoteObjects.create(); });

  describe('RemoteObjects.handler()', function() {
    it('should throws an error if the provided adapter is not valid', function() {
      var invalidAdapter = function() {};
      try {
        remotes.handler(invalidAdapter);
      } catch (err) {
        expect(err.message).to.contain('Invalid adapter class');
        return;
      }
      throw new Error('should not get here');
    });

    it('should accept a provided adapter if valid', function() {
      remotes.handler(RestAdapter);
    });
  });
});
