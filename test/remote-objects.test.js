// Copyright IBM Corp. 2017,2018. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

const expect = require('chai').expect;
const RemoteObjects = require('../');
const RestAdapter = require('../lib/rest-adapter');
const SharedClass = require('../lib/shared-class');

describe('RemoteObjects', function() {
  let remotes;
  beforeEach(function() { remotes = RemoteObjects.create(); });

  describe('RemoteObjects.handler()', function() {
    it('should throws an error if the provided adapter is not valid', function() {
      const invalidAdapter = function() {};
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

  describe('deleteClassByName()', () => {
    it('removes the class', () => {
      class TempClass {}

      const sharedClass = new SharedClass('TempClass', TempClass);
      remotes.addClass(sharedClass);
      expect(Object.keys(remotes._classes)).to.contain('TempClass');

      remotes.deleteClassByName('TempClass');
      expect(Object.keys(remotes._classes)).to.not.contain('TempClass');
    });

    it('removes the remote hooks', () => {
      remotes.before('TempClass.' + 'find', function(ctx, next) { next(); });
      remotes.after('TempClass.' + 'find', function(ctx, next) { next(); });
      remotes.afterError('TempClass.' + 'find', function(ctx, next) { next(); });
      expect(Object.keys(remotes.listenerTree.before)).to.contain('TempClass');
      expect(Object.keys(remotes.listenerTree.after)).to.contain('TempClass');
      expect(Object.keys(remotes.listenerTree.afterError)).to.contain('TempClass');

      remotes.deleteClassByName('TempClass');
      expect(Object.keys(remotes.listenerTree.before)).to.not.contain('TempClass');
      expect(Object.keys(remotes.listenerTree.after)).to.not.contain('TempClass');
      expect(Object.keys(remotes.listenerTree.afterError)).to.not.contain('TempClass');
    });
  });

  describe('deleteTypeByName()', () => {
    it('removes the type converter', () => {
      class MyType {}

      const registeredTypes = remotes._typeRegistry._types;
      remotes.defineObjectType('MyType', data => new MyType());
      expect(Object.keys(registeredTypes)).to.contain('mytype');

      remotes.deleteTypeByName('MyType');
      expect(Object.keys(registeredTypes)).to.not.contain('mytype');
    });
  });
});
