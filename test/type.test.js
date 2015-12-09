var assert = require('assert');
var Dynamic = require('../lib/dynamic');
var httpCoerce = require('../lib/http-coerce');
var RemoteObjects = require('../');

describe('types', function() {
  var remotes;
  beforeEach(function() {
    remotes = RemoteObjects.create();
  });
  describe('remotes.defineType(name, fn)', function() {
    it('should define a new type converter', function() {
      var name = 'MyType';
      remotes.defineType(name, function(val, ctx) {
        return val;
      });
      assert(Dynamic.getConverter(name));
    });
  });

  describe('Dynamic(val, [ctx])', function() {
    describe('Dynamic.to(typeName)', function() {
      it('should convert the dynamic to the given type', function() {
        Dynamic.define('beep', function(str) {
          return 'boop';
        });
        var dyn = new Dynamic('beep');
        assert.strictEqual(dyn.to('beep'), 'boop');
      });
    });
    describe('Dynamic.canConvert(typeName)', function() {
      it('should only return true when a converter exists', function() {
        Dynamic.define('MyType', function() {});
        assert(Dynamic.canConvert('MyType'));
        assert(!Dynamic.canConvert('FauxType'));
      });
    });
    describe('Built in converters', function() {
      it('should convert Boolean values', function() {
        var shouldConvert = _shouldConvert('boolean');

        shouldConvert(true, true);
        shouldConvert(false, false);
        shouldConvert(256, true);
        shouldConvert(-1, true);
        shouldConvert(1, true);
        shouldConvert(0, false);
        shouldConvert('', false);
        // Expect all these string arguments to return true as we are
        // no longer doing sloppy conversion in Dynamic
        shouldConvert('true', true);
        shouldConvert('false', true);
        shouldConvert('0', true);
        shouldConvert('1', true);
        shouldConvert('-1', true);
        shouldConvert('256', true);
        shouldConvert('null', true);
        shouldConvert('undefined', true);

      });
      it('should convert Number values', function() {
        var shouldConvert = _shouldConvert('number');

        shouldConvert('-1', -1);
        shouldConvert('0', 0);
        shouldConvert('1', 1);
        shouldConvert('0.1', 0.1);
        shouldConvert(1, 1);
        shouldConvert(true, 1);
        shouldConvert(false, 0);
        shouldConvert({}, 'NaN');
        shouldConvert([], 0);
      });

      it('should convert Array values', function() {
        var shouldConvert = _shouldConvert('array');

        shouldConvert(0, [0]);
        shouldConvert('a', ['a']);
        shouldConvert(false, [false]);
        shouldConvert(null, []);
        shouldConvert(undefined, []);
        shouldConvert('', []);
        shouldConvert(['a'], ['a']);
      });

      it('should convert Arrays of types', function() {
        var shouldConvert = _shouldConvert(['string']);

        shouldConvert(['a', 0, 1, true], ['a', '0', '1', 'true'], ['string']);
      });

      it('should only convert Arrays one layer deep', function() {
        var shouldConvert = _shouldConvert(['string']);

        shouldConvert(['0', 1, [2, '3']], ['0', '1', '2,3']);
      });
    });

    // Assert builder for Dynamic
    function _shouldConvert(type) {
      return function(val, expected) {
        val = new Dynamic(val).to(type);

        if (expected === 'NaN') return assert(Number.isNaN(val));

        if (Array.isArray(type) || type === 'array') {
          assert.deepEqual(val, expected);
          for (var i = 0; i < val.length; i++) {
            assert.strictEqual(val[i], expected[i]);
          }
        } else {
          assert.strictEqual(val, expected);
        }
      };
    }
  });

  describe('Sloppy HTTP converter', function() {
    it('should convert strings to primitives', function() {
      shouldConvert('true', true);
      shouldConvert('false', false);
      shouldConvert('0', 0);
      shouldConvert('-0', 0);
      shouldConvert('1', 1);
      shouldConvert('-1', -1);
      shouldConvert('256', 256);
      shouldConvert('1.022', 1.022);
      shouldConvert('0.49', 0.49);
      shouldConvert('null', null);
      shouldConvert('undefined', undefined);
    });

    // See https://github.com/strongloop/strong-remoting/issues/223
    it('should not convert numbers larger than Number.MAX_SAFE_INTEGER', function() {
      shouldConvert('2343546576878989879789', '2343546576878989879789');
    });

    it('should not convert ints with leading zeroes', function() {
      shouldConvert('0291', '0291');
    });

    it('should not attempt to convert arrays unless given array target type', function() {
      shouldConvert('["a","b","c"]', '["a","b","c"]');
    });

    it('should convert literal null to null', function() {
      shouldConvert(null, null);
    });

    it('should convert literal undefined to undefined', function() {
      shouldConvert(undefined, undefined);
    });

    it('should convert the empty string to undefined', function() {
      shouldConvert('', undefined); // chosen for compat with es6 defaults
    });

    it('should coerce JSON-parsable strings', function() {
      shouldConvertArray('["a","b","c"]', ['a', 'b', 'c']);
      shouldConvertArray('[1,2,3]', [1, 2, 3]);
      shouldConvertArray('["a","b",3]', ['a', 'b', 3]);
      // Note lack of 'undefined' which is not valid JSON
      shouldConvertArray('[false,true,3,"c",null,"hello"]',
        [false, true, 3, 'c', null, 'hello']);
    });

    it('should coerce strings with arrayItemDelimiters', function() {
      shouldConvertArrayWithDelims('1,2,3', [1, 2, 3], [',']);
      shouldConvertArrayWithDelims('a,b,3', ['a', 'b', 3], [',']);
      shouldConvertArrayWithDelims('false,true,3,c,undefined,null,hello',
        [false, true, 3, 'c', undefined, null, 'hello'], [',']);
      shouldConvertArrayWithDelims('false,true,3,c,undefined;null-hello',
        [false, true, 3, 'c', undefined, null, 'hello'], [',', ';', '-']);
    });

    it('should fail to parse invalid json', function() {
      // Should still have array wrappter though
      shouldConvertArray('[a,b,3]', ['[a,b,3]']);
    });

    function shouldConvert(val, expected, type, ctx) {
      val = httpCoerce(val, type || 'any', ctx || {});
      // Believe it or not, deepEqual will actually match '1' and 1, so check types
      assert.strictEqual(typeof val, typeof expected);
      assert.deepEqual(val, expected);
    }

    function shouldConvertArray(val, expected, ctx) {
      return shouldConvert(val, expected, ['any'], ctx);
    }

    function shouldConvertArrayWithDelims(val, expected, delims) {
      return shouldConvertArray(val, expected, {options: {arrayItemDelimiters: delims}});
    }
  });
});
