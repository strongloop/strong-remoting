var Dynamic = require('../lib/dynamic');
var RemoteObjects = require('../');

describe('types', function () {
  var remotes;
  beforeEach(function() {
    remotes = RemoteObjects.create();
  });
  describe('remotes.convert(name, fn)', function () {
    it('should define a new type converter', function () {
      var name = 'MyType';
      remotes.convert(name, function(val, ctx) {
        return val;
      });
      assert(Dynamic.getConverter(name));
    });
  });

  describe('Dynamic(val, [ctx])', function () {
    describe('Dynamic.to(typeName)', function () {
      it('should convert the dynamic to the given type', function () {
        Dynamic.define('beep', function(str) {
          return 'boop';
        });
        var dyn = new Dynamic('beep');
        assert.equal(dyn.to('beep'), 'boop');        
      });
    });
    describe('Dynamic.canConvert(typeName)', function () {
      it('should only return true when a converter exists', function () {
        Dynamic.define('MyType', function() {});
        assert(Dynamic.canConvert('MyType'));
        assert(!Dynamic.canConvert('FauxType'));
      });
    });
  });
});
