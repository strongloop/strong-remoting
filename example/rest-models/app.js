/**
 * To run this app do this:
 * 
 * $ npm install express jugglingdb
 * $ node app.js
 */

var express = require('express');
var app = express();
var remotes = require('./remotes');

// Disable X-Powered-By header
app.disable('x-powered-by');

app.use(remotes.handler('rest'));
app.use(express.static('public'));

app.listen(3000);
