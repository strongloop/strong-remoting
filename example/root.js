// Copyright IBM Corp. 2013,2017. All Rights Reserved.
// Node module: strong-remoting
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

// create a set of shared classes
var remotes = require('../').create();

// expose a simple object
var products = remotes.exports.products = {
  find: function(fn) {
    fn(null, ['tv', 'vcr', 'radio']);
  },
};

// share the find method
products.find.shared = true;
products.find.returns = {arg: 'products', root: true, type: 'array'};

// expose it over http
require('http')
  .createServer(remotes.handler('rest'))
  .listen(3000);

/*

Test the above with curl or a rest client:

  $ node root.js
  $ curl http://localhost:3000/products/find
  # responds as an array (instead of an object)
  [
    "tv",
    "vcr",
    "radio"
  ]

*/
