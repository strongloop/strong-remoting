var RemoteObjects = require('../');
var express = require('express');
var request = require('supertest');


describe('sl-remoting', function(){
  var app;
  var server;
  var objects;
  
  // setup
  beforeEach(function(done){
    if(server) server.close();
    objects = RemoteObjects.create();
    app = express();
    server = require('http').createServer(app).listen(3000, done);
  });
  
  // add a method
  function add(parent, name) {
    // all test functions echo their arguments
    function fn() {
      var args = Array.prototype.slice.call(arguments, 0);
      
      // add null for err
      args.unshift(null);
      
      // callback
      args.pop().apply(this, args);
    }
    
    function ctor() {
      this.ctorArgs = arguments;
    }
    
    var o = objects.exports;
    
    // a class
    if(parent[0] === parent[0].toUpperCase()) {
      o[parent] = ctor;
      ctor.prototype[name] = fn;
    } else {
      o[parent] = {};
      o[parent][name] = fn;
    }
    
    // settings
    fn.shared = true;
    
    return fn;
  }
  
  function json(method, url) {
    return request(app)[method](url)
      .set('Accept', 'application/json')
      .expect(200)
      .expect('Content-Type', /json/);
  }
  
  describe('handlers', function(){
    describe('rest', function(){
      it('should support calling object methods', function(done) {
        var fn = add('hello', 'world');

        fn.accepts = {arg: 'foo', type: 'string'};
        fn.returns = {arg: 'foo', type: 'string'};

        app.use(objects.handler('rest'));

        json('get', '/hello/world?foo=bar')
          .expect({data: 'bar'}, done);
      });
      
      it('should support binary', function(done) {
        var fn = add('file', 'upload');
        var buf = new Buffer('1234').toString('base64');

        fn.accepts = {arg: 'file', type: 'buffer'};

        app.use(objects.handler('rest'));

        json('post', '/file/upload')
          .send({file: {data: buf, type: 'base64'}})
          .expect({data: buf, type: 'base64'}, done);
      });
    });
  });
});