var expect = require('chai').expect;
var TypeRegistry = require('../lib/type-registry');

describe('TypeRegistry', function() {
  var registry;
  beforeEach(function() {
    registry = new TypeRegistry();
  });

  it('refuses to override built-in file type', function() {
    expect(function() {
      registry.registerType('File', {
        fromTypedValue: function() {},
        fromSloppyValue: function() {},
        validate: function() {},
      });
    }).to.throw(/file/);
  });
});
