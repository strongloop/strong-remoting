// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

module.exports = {
  looksLikeJson: looksLikeJson,
  looksLikeJsonArray: looksLikeJsonArray,
  looksLikeJsonObject: looksLikeJsonObject,
};

function looksLikeJson(value) {
  return looksLikeJsonObject(value) || looksLikeJsonArray(value);
}

function looksLikeJsonArray(value) {
  return typeof value === 'string' &&
    value[0] === '[' && value[value.length - 1] === ']';
}

function looksLikeJsonObject(value) {
  return typeof value === 'string' &&
    value[0] === '{' && value[value.length - 1] === '}';
}

