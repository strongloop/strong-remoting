// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

// To support Node v.0.10.x
var number = module.exports = {
  MAX_SAFE_INTEGER: Number.MAX_SAFE_INTEGER || 9007199254740991,
  MIN_SAFE_INTEGER: Number.MIN_SAFE_INTEGER || -9007199254740991,
  isInteger: Number.isInteger || function(value) {
    return typeof value === 'number' &&
      isFinite(value) &&
      Math.floor(value) === value;
  },
  isSafeInteger: Number.isSafeInteger || function(value) {
    return number.isInteger(value) &&
      value >= number.MIN_SAFE_INTEGER &&
      value <= number.MAX_SAFE_INTEGER;
  },
};
