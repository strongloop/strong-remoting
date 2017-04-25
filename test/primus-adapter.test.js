// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var assert = require('assert');
var extend = require('util')._extend;
var inherits = require('util').inherits;
var RemoteObjects = require('../');
var PrimusAdapter = require('../lib/primus-adapter');
var PrimusContext = require('../lib/primus-context');
var SharedClass = require('../lib/shared-class');
var SharedMethod = require('../lib/shared-method');
var expect = require('chai').expect;
var factory = require('./helpers/shared-objects-factory.js');
function NOOP() {};

describe('PrimusAdapter', function() {
  var remotes;

  beforeEach(function() {
    remotes = RemoteObjects.create();
  });

  describe('invoke()', function() {
    var remotes;

    beforeEach(function() {
      remotes = RemoteObjects.create();
    });

    afterEach(function() {});

    it('should call remote hooks', function(done) {
      var beforeCalled = false;
      var afterCalled = false;
      var name = 'testClass.testMethod';

      remotes.before(name, function(ctx, next) {
        beforeCalled = true;
        next();
      });

      remotes.after(name, function(ctx, next) {
        afterCalled = true;
        next();
      });

      var primusAdapter = getPrimusAdapter({isStatic: true});
      var method = remotes.findMethod(name);
      var ctx = getPrimusContext(method, [], remotes);
      primusAdapter.invoke(ctx, method, [], function() {
        assert(beforeCalled);
        assert(afterCalled);
        done();
      });
    });

    it('should propagate the ctx object', function(done) {
      var beforeCalled = false;
      var afterCalled = false;
      var name = 'testClass.testMethod';

      remotes.before(name, function(ctx, next) {
        ctx.value = true;
        next();
      });

      var methodConfig = {
        accepts: [
          {arg: 'ctx', type: 'object', http: {source: 'context'}},
        ],
      };

      var methodFn = function(ctx, callback) {
        assert(ctx instanceof PrimusContext);
        assert(ctx.value);
        callback();
      };

      var primusAdapter = getPrimusAdapter(methodConfig, methodFn);
      var method = remotes.findMethod(name);
      var ctx = getPrimusContext(method, [], remotes);

      primusAdapter.invoke(ctx, method, [], function(err, result) {
        if (err) {
          return done(err);
        }

        done();
      });
    });

    function getPrimusAdapter(methodConfig, methodFn, classConfig) {
      var name = 'testMethod';
      methodConfig = extend({isStatic: true, accepts: [], returns: []}, methodConfig);
      classConfig = extend({shared: true}, classConfig);
      var testClass = extend({}, classConfig);
      testClass[name] = methodFn || function(done) { done(); };

      var sharedClass = new SharedClass('testClass', testClass);
      sharedClass.defineMethod(name, methodConfig);
      remotes.addClass(sharedClass);
      return new PrimusAdapter(remotes);
    }

    function getPrimusContext(method, args, remotes) {
      return new PrimusContext(method, null, args, args, remotes);
    }
  });
});

function someFunc() {
}

function ignoreDeprecationsInThisBlock() {
  before(function() {
    process.on('deprecation', NOOP);
  });

  after(function() {
    process.removeListener('deprecation', NOOP);
  });
}
