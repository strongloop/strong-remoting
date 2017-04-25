// Copyright IBM Corp. 2013,2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var g = require('strong-globalize')();
/**
 * Expose `PrimusAdapter`.
 */
module.exports = PrimusAdapter;

/**
 * Module dependencies.
 */

var EventEmitter = require('events').EventEmitter;
var debug = require('debug')('strong-remoting:primus-adapter');
var util = require('util');
var inherits = util.inherits;
var assert = require('assert');
var Primus = require('primus');
var PrimusContext = require('./primus-context');

/**
 * Create a new `PrimusAdapter` with the given `remotes`, `server`.
 * @param remotes
 * @param server
 * @constructor
 */

function PrimusAdapter(remotes, server, primusInstance) {
  EventEmitter.apply(this, arguments);

  // throw an error if args are not supplied
  // assert(typeof options === 'object',
  //   'RestAdapter requires an options object');

  this.remotes = remotes;
  this.server = server;
  this.primus = primusInstance;
  this.Context = PrimusContext;
}

/**
 * Inherit from `EventEmitter`.
 */

inherits(PrimusAdapter, EventEmitter);

/*!
 * Simplified APIs
 */

PrimusAdapter.create = function(remotes) {
  // add simplified construction / sugar here
  return new PrimusAdapter(remotes);
};

PrimusAdapter.prototype.connect = function(url) {
  return this;
};

PrimusAdapter.prototype.createHandler = function() {
  var adapter = this;
  var remotes = this.remotes;
  var classes = this.remotes.classes();
  var primus = this.primus || new Primus(this.server);
  primus.plugin('emit', require('primus-emitter'));

  primus.on('connection', function(spark) {
    adapter.spark = spark;
    spark.on('invoke', function(data, done) {
      var method = remotes.findMethod(data.methodString);
      // console.log(remotes.methods());
      var ctx = new PrimusContext(method, spark, data.args, data.args, remotes);

      if (method) {
        adapter.invoke(ctx, method, data.args, function(err, result) {
          if (err) {
            done({err: err});
          }

          return done(null, result);
        });
      } else {
        done({err: 'no method with this name'});
      }
    });
  });
};

PrimusAdapter.prototype.invoke = function(ctx, method, args, callback) {
  var remotes = this.remotes;

  if (method.isStatic) {
    remotes.execHooks('before', method, method.ctor, ctx, function(err) {
      if (err) return callback(err);

      // invoke the static method on the actual constructor
      ctx.invoke(method.ctor, method, function(err, result) {
        if (err) return callback(err);
        ctx.result = result;
        remotes.execHooks('after', method, method.ctor, ctx, function(err) {
          // send the result
          callback(err, ctx.result);
        });
      });
    });
  } else {
    // invoke the shared constructor to get an instance
    ctx.invoke(method.ctor, method.sharedCtor || method, function(err, inst) {
      if (err) return callback(err);
      remotes.execHooks('before', method, inst, ctx, function(err) {
        if (err) {
          callback(err);
        } else {
          // invoke the instance method
          ctx.invoke(inst, method, function(err, result) {
            if (err) return callback(err);

            ctx.result = result;
            remotes.execHooks('after', method, inst, ctx, function(err) {
              // send the result
              callback(err, ctx.result);
            });
          });
        }
      });
    });
  }
};
