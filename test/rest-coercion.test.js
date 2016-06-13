// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var debug = require('debug')('test');
var expect = require('chai').expect;
var express = require('express');
var fs = require('fs');
var supertest = require('supertest');
var path = require('path');

var RemoteObjects = require('..');

describe('Coercion in RestAdapter', function() {
  var ctx = {
    remoteObject: null,
    request: null,
    ERROR_BAD_REQUEST: new Error(400),
    prettyExpectation: prettyExpectation,
    verifyResultOnResponse: verifyResultOnResponse,
    runtime: {
      _reportData: {},
      currentSuiteName: null,
      currentInput: null,
    },
  };

  before(setupRemoteServer);
  beforeEach(setupRemoteObjects);
  after(stopRemoteServer);
  after(writeReport);

  loadAllTestFiles();

  /***** IMPLEMENTATION DETAILS *****/

  var server; // eslint-disable-line one-var
  function setupRemoteServer(done) {
    var app = express();
    app.use(function(req, res, next) {
      // create the handler for each request
      ctx.remoteObjects.handler('rest').apply(ctx.remoteObjects, arguments);
    });
    server = app.listen(0, '127.0.0.1', function() {
      ctx.request = supertest('http://127.0.0.1:' + this.address().port);
      done();
    });
    server.on('error', done);
  }

  function stopRemoteServer() {
    server.close();
  }

  function setupRemoteObjects() {
    ctx.remoteObjects = RemoteObjects.create({
      errorHandler: { debug: true, log: false },
    });
  }

  function loadAllTestFiles() {
    var _describe = global.describe;
    global.describe = function(name, fn) {
      _describe.call(this, name, function() {
        beforeEach(function() {
          ctx.runtime.currentSuiteName = name;
          ctx.runtime.currentInput = undefined;
        });
        fn.apply(this, arguments);
      });
    };

    var testRoot = path.resolve(__dirname, 'rest-coercion');
    var testFiles = fs.readdirSync(testRoot);
    testFiles = testFiles.filter(function(it) {
      return /\.suite\.js$/.test(it) &&
        !!require.extensions[path.extname(it).toLowerCase()];
    });

    for (var ix in testFiles) {
      var name = testFiles[ix];
      var fullPath = path.resolve(testRoot, name);
      debug('Loading test suite %s (%s)', name, fullPath);
      require(fullPath)(ctx);
    }

    global.describe = _describe;
  }

  function prettyExpectation(expectedValue) {
    if (expectedValue instanceof Error)
      return 'HTTP error ' + expectedValue.message;
    if (Array.isArray(expectedValue))
      return '[' + expectedValue.map(prettyExpectation).join(', ') + ']';
    if (expectedValue instanceof Date)
      return isNaN(expectedValue.valueOf()) ?
        '<Invalid Date>' : '<Date: ' + expectedValue.toJSON() + '>';
    return JSON.stringify(expectedValue);
  }

  function verifyResultOnResponse(err, res, actualValue, expectedResult, done) {
    if (err && !res) return done(err);
    var actual = res.statusCode === 200 ?
      { value: actualValue } :
      { error: res.statusCode };

    var expected = expectedResult instanceof Error ?
      { error: +expectedResult.message } :
      { value: expectedResult };

    var suiteName = ctx.runtime.currentSuiteName;
    var input = ctx.runtime.currentInput;
    if (suiteName && input) {
      var reportData = ctx.runtime._reportData;
      if (!reportData[suiteName])
        reportData[suiteName] = {};
      if (input in reportData[suiteName])
        return done(new Error('DUPLICATE TEST CASE: ' + input));
      reportData[suiteName][input] = actual;
    }

    expect(actual).to.eql(expected);
    done();
  }

  function writeReport() {
    var rows = [];
    var reportData = ctx.runtime._reportData;
    for (var sn in reportData) { // eslint-disable-line one-var
      var suite = reportData[sn];
      for (var tc in suite) { // eslint-disable-line one-var
        var result = suite[tc];
        result = result.error ?
           '<HTTP Error ' + result.error  + '>' :
           stringify(result.value);
        rows.push([sn, tc, result].join('\t'));
      }
    }

    var report = rows.join('\n') + '\n';
    var filePath = path.resolve(__dirname, 'rest-coercion/report.csv');
    fs.writeFileSync(filePath, report);

    function stringify(value) {
      if (Array.isArray(value))
        return '[' + value.map(stringify).join(', ') + ']';
      if (value instanceof Date)
        return isNaN(value.valueOf()) ?
          '<Invalid Date>' : '<Date: ' + value.toJSON() + '>';
      if (value === undefined)
        return '<undefined>';
      return JSON.stringify(value);
    }
  }
});
