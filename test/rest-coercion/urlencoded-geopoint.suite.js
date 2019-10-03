// Copyright IBM Corp. 2016,2017. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

const GeoPoint = require('loopback-datatype-geopoint');
const urlEncodedContext = require('./_urlencoded.context');

module.exports = function(ctx) {
  suite('query string', urlEncodedContext(ctx, 'qs'));
  suite('form data', urlEncodedContext(ctx, 'form'));
};

function suite(prefix, ctx) {
  const EMPTY_QUERY = ctx.EMPTY_QUERY;
  const ERROR_BAD_REQUEST = ctx.ERROR_BAD_REQUEST;
  const verifyTestCases = ctx.verifyTestCases;

  describe(prefix + ' - geopoint - required', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'arg', type: 'geopoint', required: true}, [
      // Valid values - nested keys
      ['arg[lat]=2.5&arg[lng]=3', new GeoPoint(2.5, 3)],
      ['arg[0]=2.5&arg[1]=3', new GeoPoint(2.5, 3)],

      // Valid values - JSON encoding
      ['arg={"lat":2.0, "lng": 3.0}', new GeoPoint(2.0, 3.0)],

      // Valid values - Google location API format
      ['arg=2.5,3', new GeoPoint(2.5, 3)],

      // Valid values - [lat,lng] array
      ['arg=[1,2]', new GeoPoint(1, 2)],

      // Empty values trigger ERROR_BAD_REQUEST
      [EMPTY_QUERY, ERROR_BAD_REQUEST],
      ['arg', ERROR_BAD_REQUEST],
      ['arg=', ERROR_BAD_REQUEST],

      // Empty-like values trigger ERROR_BAD_REQUEST too
      ['arg=null', ERROR_BAD_REQUEST],
      ['arg=undefined', ERROR_BAD_REQUEST],
      ['arg=[]', ERROR_BAD_REQUEST],
      ['arg={}', ERROR_BAD_REQUEST],
      ['arg[lat]=5&arg[lng]=null', ERROR_BAD_REQUEST],
      ['arg[lat]=5&arg[lng]=undefined', ERROR_BAD_REQUEST],
      ['arg[lat]=undefined&arg[lng]=4.4', ERROR_BAD_REQUEST],
      ['arg[lat]=null&arg[lng]=5.5', ERROR_BAD_REQUEST],
    ]);
  });

  describe(prefix + ' - geopoint - optional', function() {
    // See verifyTestCases' jsdoc for details about the format of test cases.
    verifyTestCases({arg: 'arg', type: 'geopoint'}, [
      // Empty values
      [EMPTY_QUERY, undefined],
      ['arg', undefined],
      ['arg=', undefined],

      // Valid values

      // Query string - nested values
      ['arg[lat]=0&arg[lng]=3.2', new GeoPoint(0, 3.2)],
      ['arg[lat]=-1&arg[lng]=3.2', new GeoPoint(-1, 3.2)],
      ['arg[lat]=1&arg[lng]=3.2', new GeoPoint(1, 3.2)],
      ['arg[lat]=2.5&arg[lng]=0', new GeoPoint(2.5, 0)],
      ['arg[lat]=2.5&arg[lng]=-1', new GeoPoint(2.5, -1)],
      ['arg[0]=2.5&arg[1]=2', new GeoPoint(2.5, 2)],

      // [lat, lng] array
      ['arg=[2.5, 3.2]', new GeoPoint(2.5, 3.2)],

      // Google location API format
      ['arg=2.5,3.2', new GeoPoint(2.5, 3.2)],

      // JSON encoding
      ['arg={"lat":2.0, "lng": 3.0}', new GeoPoint(2.0, 3.0)],

      // Scientific notation
      ['arg={"lat":1.234e%2B1, "lng": -1.234e%2B1}', new GeoPoint(1.234e+1, -1.234e+1)],

      // Missing values trigger ERROR_BAD_REQUEST
      ['arg=null', ERROR_BAD_REQUEST],
      ['arg={}', ERROR_BAD_REQUEST],
      ['arg=[]', ERROR_BAD_REQUEST],

      // Query string - nested values
      ['arg[lat]=2.3', ERROR_BAD_REQUEST], // missing lng
      ['arg[lng]=3', ERROR_BAD_REQUEST], // missing lat

      // Wrong spelling for 'lat' or 'lng' triggers ERROR_BAD_REQUEST
      ['arg[latt]=2.5&arg[lng]=3.3', ERROR_BAD_REQUEST],
      ['arg[lat]=2.5&arg[lang]=3.3', ERROR_BAD_REQUEST],

      // JSON encoding
      ['arg={"lat": 2.3}', ERROR_BAD_REQUEST],
      ['arg={"lng":3.5}', ERROR_BAD_REQUEST],

      // Google location API format
      ['arg=2.3', ERROR_BAD_REQUEST],

      // [lat,lng] array
      ['arg=[2]', ERROR_BAD_REQUEST],

      // Invalid values

      // Latitude beyond range: -90 to 90 triggers ERROR_BAD_REQUEST
      ['arg[lat]=-95&arg[lng]=3.5', ERROR_BAD_REQUEST],
      ['arg[lat]=95&arg[lng]=3.5', ERROR_BAD_REQUEST],

      // Longitude beyond range: -180 to 180 triggers trigger ERROR_BAD_REQUEST
      ['arg[lat]=5&arg[lng]=181.5', ERROR_BAD_REQUEST],
      ['arg[lat]=5&arg[lng]=-181.5', ERROR_BAD_REQUEST],
      // NaN triggers ERROR_BAD_REQUEST
      ['arg={"lat": NaN, "lng": 3.2}', ERROR_BAD_REQUEST],

      // String is not supported
      // Nested values
      ['arg[lat]=5&arg[lng]="null"', ERROR_BAD_REQUEST],
      ['arg[lat]="lattitude"&arg[lng]=""', ERROR_BAD_REQUEST],

      // JSON encoding
      ['arg={"lat": "text", "lng": 3.5}', ERROR_BAD_REQUEST],
      ['arg={"lat": 2.3, "lng": "text"}', ERROR_BAD_REQUEST],

      // Google location API format
      ['arg=2.3,"text"', ERROR_BAD_REQUEST],

      // [lat, lng] array
      ['arg=[2.4, "text"]', ERROR_BAD_REQUEST],

      // Number represented as string triggers ERROR_BAD_REQUEST
      ['arg=2,"3"', ERROR_BAD_REQUEST],

      // boolean value is not supported
      // nested keys
      ['arg[lat]=5&arg[lng]=true', ERROR_BAD_REQUEST],
      ['arg[lat]=5&arg[lng]=false', ERROR_BAD_REQUEST],

      // Google location API format
      ['arg=true,false', ERROR_BAD_REQUEST],

      // JSON encoding
      ['arg={"lat": true, "lng": false}', ERROR_BAD_REQUEST],

      // array of boolean is not allowed
      ['arg=[true, false]', ERROR_BAD_REQUEST],

      // Miscellaneous
      // [lat,lng] array
      // array with more than two elements triggers ERROR_BAD_REQUEST
      ['arg=[2,3,4]', ERROR_BAD_REQUEST],
      // array of object is not allowed
      ['arg=[{}]', ERROR_BAD_REQUEST],

      // Google location API format
      // more than two values seperated by comma triggers ERROR_BAD_REQUEST
      ['arg=2,4,5', ERROR_BAD_REQUEST],
    ]);
  });
}
