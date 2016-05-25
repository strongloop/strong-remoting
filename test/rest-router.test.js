var assert = require('assert');
var expect = require('chai').expect;
var RestRouter = require('../lib/rest-router.js');
var Trie = require('../lib/trie.js');
var express = require('express');
var supertest = require('supertest');
var http = require('http');

describe('RestRouter', function() {
  // Test init
  it('initializes with Trie datastructure', function(done) {
    var router = new RestRouter();
    expect(router).to.have.property('_trie');
    expect(router._trie).to.be.instanceOf(Trie);
    done();
  });

  // test handle
  it('handles a request', function(done) {
    var app = express();
    var router = new RestRouter();
    var route = { fullPath: '/example', verb: 'get' };
    var resBody = 'Hello Wold!';
    // this doesn't make sense to me that I have to call router.get(...)
    // as well as have route.verb = get
    // it doesn't work without it
    router.get(route, function(req, res) {
      res.end(resBody);
    });
    app.use(router);
    console.log(router._trie);
    supertest(app)
      .get(route.fullPath)
      .expect(200)
      .expect(resBody)
      .end(function(err, res) {
        if (err) return done(err);
        done();
      });
  });

  // test handle param
  it('handles a request with a parameter', function(done) {
    var app = express();
    var router = new RestRouter();
    var route = { fullPath: '/example/:id', verb: 'get' };
    var id = '1';
    // this doesn't make sense to me that I have to call router.get(...)
    // as well as have route.verb = get
    // it doesn't work without it
    router.get(route, function(req, res, next) {
      console.log('hit');
      res.end(id);
    });
    app.use(router);
    console.log(router._trie);
    supertest(app)
      .get(route.fullPath.replace(':id', id))
      .expect(200)
      .expect(id)
      .end(function(err, res) {
        console.log(res.body);
        if (err) return done(err);
        done();
      });
  });

  // test handle param with method after
  // it('handles a request for a instance method', function() {
  //   var app = express();
  //   var router = new RestRouter();
  //   var route = { fullPath: '/example/:id/properties', verb: 'get' };
  //   var id = '1';
  //   // this doesn't make sense to me that I have to call router.get(...)
  //   // as well as have route.verb = get
  //   // it doesn't work without it
  //   router.get(route, function(req, res, next) {
  //     // List the properties of a mock object
  //     res.end(req.fullPath);
  //   });
  //   app.use(router);
  //   console.log(router._trie);
  //   supertest(app)
  //     .get(route.fullPath.replace(':id', id))
  //     .expect(200)
  //     .expect(id)
  //     .end(function(err, res) {
  //       console.log(res.body);
  //       if (err) return done(err);
  //       done();
  //     });
  // });
});
