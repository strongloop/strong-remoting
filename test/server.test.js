var Remotes = require('../');

describe('Server', function(){
  var server;
  
  beforeEach(function(){
    server = Remotes.createServer();
  });
  
  describe('.exports', function(){
    it('should exist', function() {
      assert.equal(server.exports, {});
    });
  });
  
  describe('.transport(name)', function(){
    it('should add a handler', function() {
      server.transport('rest');
      assert(server.handler)
    });
  });
});