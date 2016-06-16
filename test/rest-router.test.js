var assert = require('assert');
var expect = require('chai').expect;
var RestRouter = require('../lib/rest-router.js');
var RouterLookup = require('../lib/router-lookup.js');
var express = require('express');
var supertest = require('supertest');
var http = require('http');

describe.only('RestRouter', function() {
  // Test init
  it('initializes with RouterLookup Class', function(done) {
    var router = new RestRouter();
    expect(router).to.have.property('_lookup');
    // expect(router._lookup).to.be.instanceOf(RouterLookup);
    done();
  });

  // test handle
  it('handles a request', function(done) {
    var app = express();
    var router = new RestRouter();
    var fullPath = '/example';
    var resBody = 'Hello Wold!';
    // this doesn't make sense to me that I have to call router.get(...)
    // as well as have route.verb = get
    // it doesn't work without it
    router.get(fullPath, function(req, res) {
      res.end(resBody);
    });
    app.use(router);
    supertest(app)
      .get(fullPath)
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
    var fullPath = '/example/:id';
    var id = '1';

    router.get(fullPath, function(req, res, next) {
      console.log('req.params: ', req.params);
      res.end(req.params.id);
    });
    app.use(router);

    supertest(app)
      .get(fullPath.replace(':id', id))
      .expect(200)
      .expect(id)
      .end(function(err, res) {
        if (err) return done(err);
        done();
      });
  });

  // test handle param with method after
  it('handles a request for a instance method', function() {
    var app = express();
    var router = new RestRouter();
    var fullPath = '/example/:id/properties';
    var id = '1';

    router.get(fullPath, function(req, res, next) {
      // List the properties of a mock object
      res.end(req.params.id);
    });
    app.use(router);

    supertest(app)
      .get(fullPath.replace(':id', id))
      .expect(200)
      .expect(id)
      .end(function(err, res) {
        if (err) return done(err);
        done();
      });
  });
});
