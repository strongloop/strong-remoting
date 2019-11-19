// Copyright IBM Corp. 2014,2018. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

const assert = require('assert');
const extend = require('util')._extend;
const expect = require('./helpers/expect');
const Context = require('../lib/context-base');
const SharedMethod = require('../lib/shared-method');
const TypeRegistry = require('../lib/type-registry');
const factory = require('./helpers/shared-objects-factory.js');
const Promise = global.Promise || require('bluebird');

describe('SharedMethod', function() {
  const STUB_CLASS = {};
  const STUB_METHOD = function(cb) { cb(); };

  describe('constructor', function() {
    it('normalizes "array" type in "accepts" arguments', function() {
      const sharedMethod = new SharedMethod(STUB_METHOD, 'a-name', STUB_CLASS, {
        accepts: {arg: 'data', type: 'array'},
      });

      expect(sharedMethod.accepts).to.eql([
        {arg: 'data', type: ['any']},
      ]);
    });

    it('normalizes "array" type in "returns" arguments', function() {
      const sharedMethod = new SharedMethod(STUB_METHOD, 'a-name', STUB_CLASS, {
        returns: {arg: 'data', type: 'array'},
      });

      expect(sharedMethod.returns).to.eql([
        {arg: 'data', type: ['any']},
      ]);
    });

    it('passes along `documented` flag correctly', function() {
      const sharedMethod = new SharedMethod(STUB_METHOD, 'a-name', STUB_CLASS, {
        documented: false,
      });

      expect(sharedMethod.documented).to.eql(false);
    });
  });

  describe('sharedMethod.isDelegateFor(suspect, [isStatic])', function() {
    // stub function
    function myFunction() {}

    it('checks if the given function is going to be invoked', function() {
      const mockSharedClass = {};
      const sharedMethod = new SharedMethod(myFunction, 'myName', mockSharedClass);
      assert.equal(sharedMethod.isDelegateFor(myFunction), true);
    });

    it('checks by name if a function is going to be invoked', function() {
      const mockSharedClass = {prototype: {myName: myFunction}};
      const sharedMethod = new SharedMethod(myFunction, 'myName', mockSharedClass);
      assert.equal(sharedMethod.isDelegateFor('myName', false), true);
      assert.equal(sharedMethod.isDelegateFor('myName', true), false);
      assert.equal(sharedMethod.isDelegateFor('myName'), true);
    });

    it('checks by name if static function is going to be invoked', function() {
      const mockSharedClass = {myName: myFunction};
      const opts = {isStatic: true};
      const sharedMethod = new SharedMethod(myFunction, 'myName', mockSharedClass, opts);
      assert.equal(sharedMethod.isDelegateFor('myName', true), true);
      assert.equal(sharedMethod.isDelegateFor('myName', false), false);
    });

    it('checks by alias if static function is going to be invoked', function() {
      const mockSharedClass = {myName: myFunction};
      const opts = {isStatic: true, aliases: ['myAlias']};
      const sharedMethod = new SharedMethod(myFunction, 'myName', mockSharedClass, opts);
      assert.equal(sharedMethod.isDelegateFor('myAlias', true), true);
      assert.equal(sharedMethod.isDelegateFor('myAlias', false), false);
    });

    it('checks if the given name is a string', function() {
      const mockSharedClass = {};
      let err;
      try {
        const sharedMethod = new SharedMethod(myFunction, Number, mockSharedClass);
      } catch (e) {
        err = e;
      }
      assert(err);
    });
  });

  describe('sharedMethod.isDelegateForName(suspect)', function() {
    // stub function
    function myFunction() {}

    it('checks by name if static function is going to be invoked', function() {
      const mockSharedClass = {myName: myFunction};
      const opts = {isStatic: true};
      const sharedMethod = new SharedMethod(myFunction, 'myName', mockSharedClass, opts);
      assert.equal(sharedMethod.isDelegateForName('myName'), true);
    });

    it('checks by alias if static function is going to be invoked', function() {
      const mockSharedClass = {myName: myFunction};
      const opts = {isStatic: true, aliases: ['myAlias']};
      const sharedMethod = new SharedMethod(myFunction, 'myName', mockSharedClass, opts);
      assert.equal(sharedMethod.isDelegateForName('myAlias'), true);
    });

    it('checks by name if prototype function is going to be invoked', function() {
      const mockSharedClass = {myName: myFunction};
      const opts = {isStatic: false};
      const sharedMethod = new SharedMethod(myFunction, 'myName', mockSharedClass, opts);
      assert.equal(sharedMethod.isDelegateForName('prototype.myName'), true);
    });

    it('checks by alias if prototype function is going to be invoked', function() {
      const mockSharedClass = {myName: myFunction};
      const opts = {isStatic: false, aliases: ['myAlias']};
      const sharedMethod = new SharedMethod(myFunction, 'myName', mockSharedClass, opts);
      assert.equal(sharedMethod.isDelegateForName('prototype.myAlias'), true);
    });

    it('checks if the given name is a string', function() {
      const mockSharedClass = {};
      let err;
      const sharedMethod = new SharedMethod(myFunction, 'myName', mockSharedClass);
      expect(function() { sharedMethod.isDelegateForName(myFunction); }).to.throw(/argument.*string/);
    });
  });

  describe('sharedMethod.invoke', function() {
    it('returns 400 when number argument is `NaN`', function(done) {
      const method = givenSharedMethod({
        accepts: {arg: 'num', type: 'number'},
      });

      method.invoke('ctx', {num: NaN}, {}, ctx(method), function(err) {
        setImmediate(function() {
          expect(err).to.exist();
          expect(err.message).to.contain('not a number');
          expect(err.statusCode).to.equal(400);
          done();
        });
      });
    });
    describe('data type: integer', function() {
      describe('SharedMethod.getType - determine actual type based on value', function() {
        it('returns type: number for decimal value & integer target type',
          function() {
            expect(SharedMethod.getType(15.2, 'integer')).to.equal('number');
          });
        it('returns type:integer for intiger value & integer target type',
          function() {
            expect(SharedMethod.getType(14, 'integer')).to.equal('integer');
          });
      });

      it('returns 400 when integer argument is a decimal number',
        function(done) {
          const method = givenSharedMethod({
            accepts: {arg: 'num', type: 'integer'},
          });

          method.invoke('ctx', {num: 2.5}, {}, ctx(method), function(err) {
            setImmediate(function() {
              expect(err).to.exist();
              expect(err.message).to.match(/not a safe integer/);
              expect(err.statusCode).to.equal(400);
              done();
            });
          });
        });

      it('returns 400 when integer argument is `NaN`', function(done) {
        const method = givenSharedMethod({
          accepts: {arg: 'num', type: 'integer'},
        });

        method.invoke('ctx', {num: NaN}, {}, ctx(method), function(err) {
          setImmediate(function() {
            expect(err).to.exist();
            expect(err.message).to.match(/not a number/i);
            expect(err.statusCode).to.equal(400);
            done();
          });
        });
      });

      it('returns 400 when integer argument is not a safe integer',
        function(done) {
          const method = givenSharedMethod(
            function(arg, cb) {
              return cb({'num': arg});
            },
            {
              accepts: {arg: 'num', type: 'integer'},
            },
          );

          method.invoke('ctx', {num: 2343546576878989879789}, {}, ctx(method),
            function(err) {
              setImmediate(function() {
                expect(err).to.exist();
                expect(err.message).to.match(/integer/i);
                expect(err.statusCode).to.equal(400);
                done();
              });
            });
        });

      it('treats integer argument of type x.0 as integer', function(done) {
        const method = givenSharedMethod(
          function(arg, cb) {
            return cb({'num': arg});
          },
          {
            accepts: {arg: 'num', type: 'integer'},
          },
        );

        method.invoke('ctx', {num: 12.0}, {}, ctx(method), function(result) {
          setImmediate(function() {
            expect(result.num).to.equal(12);
            done();
          });
        });
      });

      it('returns 500 for non-integer return value if type: `integer`',
        function(done) {
          const method = givenSharedMethod(
            function(cb) {
              cb(null, 3.141);
            },
            {
              returns: {arg: 'value', type: 'integer'},
            },
          );

          method.invoke('ctx', {}, {}, ctx(method), function(err, result) {
            setImmediate(function() {
              expect(err).to.exist();
              expect(err.message).to.match(/integer/i);
              expect(err.statusCode).to.equal(500);
              done();
            });
          });
        });

      it('returns 500 if returned value is not a safe integer', function(done) {
        const method = givenSharedMethod(
          function(cb) {
            cb(null, -2343546576878989879789);
          },
          {
            returns: {arg: 'value', type: 'integer'},
          },
        );

        method.invoke('ctx', {}, {}, ctx(method), function(err, result) {
          setImmediate(function() {
            expect(err).to.exist();
            expect(err.message).to.match(/integer/i);
            expect(err.statusCode).to.equal(500);
            done();
          });
        });
      });
    });

    describe('data type: Date', function() {
      it('converts return values to GMT timezone', function(done) {
        const method = givenSharedMethod(
          function(cb) {
            cb(null, new Date(0));
          },
          {
            returns: {arg: 'value', type: 'date'},
          },
        );

        method.invoke('ctx', {}, {}, ctx(method), function(err, result) {
          setImmediate(function() {
            if (err) return done(err);
            expect(result).to.eql({
              value: {
                $type: 'date',
                $data: '1970-01-01T00:00:00.000Z',
              },
            });
            done();
          });
        });
      });
    });

    it('returns 400 and doesn\'t crash with unparsable object', function(done) {
      const method = givenSharedMethod({
        accepts: [{arg: 'obj', type: 'object'}],
      });

      method.invoke('ctx', {obj: 'test'}, {}, ctx(method), function(err) {
        setImmediate(function() {
          expect(err).to.exist();
          expect(err.message).to.contain('not an object');
          expect(err.statusCode).to.equal(400);
          done();
        });
      });
    });

    it('resolves promise returned from the method', function(done) {
      const method = givenSharedMethod(
        function() {
          return new Promise(function(resolve, reject) {
            resolve(['one', 'two']);
          });
        },
        {
          returns: [
            {arg: 'first', type: 'string'},
            {arg: 'second', type: 'string'},
          ],
        },
      );

      method.invoke('ctx', {}, {}, ctx(method), function(err, result) {
        setImmediate(function() {
          expect(result).to.eql({first: 'one', second: 'two'});
          done();
        });
      });
    });

    it('handles promise resolved with a single arg', function(done) {
      const method = givenSharedMethod(
        function() {
          return new Promise(function(resolve, reject) {
            resolve('data');
          });
        },
        {
          returns: [
            {arg: 'value', type: 'string'},
          ],
        },
      );

      method.invoke('ctx', {}, {}, ctx(method), function(err, result) {
        setImmediate(function() {
          expect(result).to.eql({value: 'data'});
          done();
        });
      });
    });

    it('handles promise resolved with a single array arg', function(done) {
      const method = givenSharedMethod(
        function() {
          return new Promise(function(resolve, reject) {
            resolve(['a', 'b']);
          });
        },
        {
          returns: [
            {arg: 'value', type: ['string']},
          ],
        },
      );

      method.invoke('ctx', {}, {}, ctx(method), function(err, result) {
        setImmediate(function() {
          expect(result).to.eql({value: ['a', 'b']});
          done();
        });
      });
    });

    it('handles rejected promise returned from the method', function(done) {
      const testError = new Error('expected test error');
      const method = givenSharedMethod(function() {
        return new Promise(function(resolve, reject) {
          reject(testError);
        });
      });

      method.invoke('ctx', {}, {}, ctx(method), function(err, result) {
        setImmediate(function() {
          expect(err).to.equal(testError);
          done();
        });
      });
    });
    it('should remove from result the targeted value from promise', function(done) {
      const body = {everything: 'ok'};
      const method = givenSharedMethod(function() {
        return Promise.resolve([201, body]);
      }, {
        returns: [
          {arg: 'statusResult', type: 'number', http: {target: 'status'}},
          {arg: 'result', type: 'object', root: true},
        ],
      });
      const context = ctx(method);
      // override function that should be provided in HttpContext
      context.setReturnArgByName = function(name) {
        return name === 'statusResult';
      };
      method.invoke('ctx', {}, {}, context, function(err, result) {
        setImmediate(function() {
          expect(result).to.not.have.property('statusResult');
          expect(result).to.eql(body);
          done();
        });
      });
    });
  });

  function givenSharedMethod(fn, options) {
    if (options === undefined && typeof fn === 'object') {
      options = fn;
      fn = function() {
        arguments[arguments.length - 1]();
      };
    }

    const mockSharedClass = {fn: fn};
    return new SharedMethod(fn, 'fn', mockSharedClass, options);
  }

  function ctx(method) {
    return new Context(method, new TypeRegistry({warnOnUnknownType: false}));
  }
});
