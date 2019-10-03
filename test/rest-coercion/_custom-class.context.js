// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

const extend = require('util')._extend;

function CustomClass(data) {
  if (!(this instanceof CustomClass))
    return new CustomClass(data);

  if (data.invalid) {
    const err = new Error('Invalid CustomClass value.');
    err.statusCode = 400;
    throw err;
  }

  if ('name' in data)
    this.name = data.name;
  else
    this.empty = true;
}

module.exports = function createCustomClassContext(ctx) {
  beforeEach(function registerCustomClass() {
    if ('customclass' in ctx.remoteObjects._typeRegistry._types) {
      // This happens when there are multiple instances of this beforEach hook
      // registered. Typically when createCustomClassContext is called
      // inside the top-level "describe" block.
      return;
    }
    ctx.remoteObjects.defineObjectType('CustomClass', CustomClass);
  });

  return extend(Object.create(ctx), {
    CustomClass: CustomClass,
    verifyTestCases: verifyTestCases,
  });

  function verifyTestCases(argSpec, testCases) {
    for (const ix in testCases) {
      if (testCases[ix].length === 1) {
        const data = testCases[ix][0];
        testCases[ix] = [data, new CustomClass(data)];
      }
    }
    ctx.verifyTestCases(argSpec, testCases);
  }
};
