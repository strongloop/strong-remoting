2015-01-15, Version 2.11.1
==========================

 * Optimize the code to remove closure and bind (Raymond Feng)

 * Fix parsing JSON arrays with arrayItemDelimiters on. (Samuel Reed)

 * Add remote hooks to RestAdapter.invoke method Hooks on invoke are needed to use methods like User.login remotely from loopback-connector-remote. see https://github.com/strongloop/strong-remoting/issues/150 and https://github.com/strongloop/strong-remoting/issues/105 and https://github.com/strongloop/loopback/pull/943 (Berkeley Martinez)

 * Ensure Remote-Connector Converts Types in Array Fix bug strongloop/loopback#886 (Berkeley Martinez)


2015-01-07, Version 2.11.0
==========================

 * Fix bad CLA URL in CONTRIBUTING.md (Ryan Graham)

 * Allow accessType to be configured per shared method (Raymond Feng)


2014-12-08, Version 2.10.1
==========================

 * Don't crash on unparseable inputs. (Samuel Reed)


2014-12-05, Version 2.10.0
==========================

 * Implement rest option `arrayItemDelimiters` (Miroslav Bajtoš)

 * shared-method: reject `NaN` numbers (Miroslav Bajtoš)

 * Add jscs to enforce consistent coding style (Miroslav Bajtoš)

 * Run grunt from `npm test`, fix warnings (Miroslav Bajtoš)

 * package: upgrade chai to ^1.10.0 (Miroslav Bajtoš)

 * Add option to disable url-not-found handling (Fabio)

 * Fix test cases that break the build (Raymond Feng)


2014-11-18, Version 2.9.0
=========================

 * Add `options.rest.xml`, disable XML by default (Miroslav Bajtoš)

 * SharedMethod: add flag `documented` (Miroslav Bajtoš)

 * Add forgotten unit-tests for XML formatting (Joel Taylor)

 * Update jsonrpc-adapter.js (ericprieto)

 * Fixed a typo (Fabio)

 * Made test of mapped parameters on JSON RPC (Fabio)

 * Fix use of loose falsy comparison when getting arguments in HttpContext. (Samuel Reed)

 * Fix the jsonrpc adapter to reference the method correctly (Raymond Feng)


2014-11-07, Version 2.8.2
=========================

 * Bump version (Raymond Feng)

 * Fix typos in the OPTIONS method (Raymond Feng)


2014-11-03, Version 2.8.1
=========================

 * rest-adapter: default options from remoting opts (Miroslav Bajtoš)


2014-10-30, Version 2.8.0
=========================

 * Relax dependency version ranges (Raymond Feng)

 * Bump version (Raymond Feng)

 * Enhance the xml/json formatting (Raymond Feng)

 * supportedTypes option. (Guilherme Cirne)

 * Fix bug with webpack trying to use AMD's "define" (Simon Degraeve)


2014-10-28, Version 2.7.1
=========================

 * Bump version (Raymond Feng)

 * Catch method invocation error to avoid crashing (Raymond Feng)

 * Ensure errorHandler.handler is a function (Ritchie Martori)

 * Add custom handler test (Ritchie Martori)

 * Ensure handler errors are caught (Ritchie Martori)

 * Ensure next() calls the default error handler in custom handlers (Ritchie Martori)

 * Added converting to XML, if requested via Accept (Shelby Sanders)

 * Changed errorHandler() to honor options.remoting.errorHandler.handler in order to replace restErrorHandler (Shelby Sanders)


2014-10-16, Version 2.5.0
=========================

 * Added missing docs for errors and notes (Shelby Sanders)

 * Added support for notes (Shelby Sanders)

 * Added support for errors property to specify possible errors that can be returned (Shelby Sanders)

 * Update contribution guidelines (Ryan Graham)

 * Add sharedClass.disableMethod() (Ritchie Martori)

 * Add prototype shared method tests (Krishna Raman)

 * Fix http-invocation test (Krishna Raman)

 * Support prototype methods via HttpInvocation (Krishna Raman)

 * Remove stupid assert global (Ritchie Martori)

 * Fix missing assert (Ritchie Martori)

 * Bump version (Raymond Feng)

 * Set up CORS hander for error responses (Raymond Feng)

 * Add a test for request header param (Raymond Feng)

 * Allows implicit header param (Raymond Feng)

 * Check the name type (Raymond Feng)

 * Add support for header param (Raymond Feng)

 * Allow args of complex type without validation (Ritchie Martori)

 * Implement normalizeHttpPath (Fabien Franzen)

 * Do not override previous Content-Type for empty response (Wilson Júnior)

 * Make sure array params are correctly deserialized (Raymond Feng)

 * Update deps and bump version (Raymond Feng)

 * Allow arg type to be ['string'] (Raymond Feng)

 * Fix the default CORS options (Raymond Feng)

 * Update deps (especially for qs) (Raymond Feng)

 * Fix the broken sample (Raymond Feng)

 * Minor doc updates and fixes (Ritchie Martori)

 * Improve shared class and method docs (Ritchie Martori)

 * Provide an option to configure if stack trace should be disabled (Raymond Feng)

 * Remove stack traces from production errors. (Samuel Reed)

 * Update test case to remove usage of deprecated express apis (Raymond Feng)

 * rest: fix RestMethod.isReturningArray (Miroslav Bajtoš)

 * Remove ext/swagger (Miroslav Bajtoš)

 * 2.0.0-beta4 (Miroslav Bajtoš)

 * 2.0.0-beta3 (Miroslav Bajtoš)

 * Exclude body-parser from the browser bundle (Miroslav Bajtoš)

 * Remove duplicate dep (Raymond Feng)

 * Add more tests and use eql for readability (Raymond Feng)

 * Add more comments (Raymond Feng)

 * Sort the routes so that methods can be resolved in order (Raymond Feng)

 * Upgrade to express 4.x (Raymond Feng)


2014-10-16, Version 1.6.0
=========================

 * Add `errors` and `notes` to method metadata (Shelby Sanders)

 * Fix failing test (Raymond Feng)

 * Upgrade qs dep (Raymond Feng)

 * rest: use `app.delete` instead of `app.del` (Miroslav Bajtoš)


2014-09-25, Version 2.2.1
=========================

 * Bump version (Raymond Feng)

 * Set up CORS hander for error responses (Raymond Feng)


2014-09-25, Version 2.2.0
=========================

 * Bump version (Raymond Feng)

 * Add a test for request header param (Raymond Feng)

 * Allows implicit header param (Raymond Feng)

 * Check the name type (Raymond Feng)

 * Add support for header param (Raymond Feng)

 * Allow args of complex type without validation (Ritchie Martori)

 * Implement normalizeHttpPath (Fabien Franzen)

 * Do not override previous Content-Type for empty response (Wilson Júnior)

 * Make sure array params are correctly deserialized (Raymond Feng)


2014-09-05, Version 2.1.0
=========================

 * Update deps and bump version (Raymond Feng)

 * Allow arg type to be ['string'] (Raymond Feng)

 * Minor doc updates and fixes (Ritchie Martori)


2014-08-18, Version 2.0.5
=========================

 * Bump version (Raymond Feng)

 * Fix the default CORS options (Raymond Feng)


2014-08-07, Version 2.0.3
=========================



2014-08-07, Version 2.0.4
=========================

 * Bump version (Raymond Feng)

 * Update deps (especially for qs) (Raymond Feng)

 * Fix the broken sample (Raymond Feng)

 * Improve shared class and method docs (Ritchie Martori)

 * Provide an option to configure if stack trace should be disabled (Raymond Feng)

 * Remove stack traces from production errors. (Samuel Reed)

 * Update test case to remove usage of deprecated express apis (Raymond Feng)

 * rest: fix RestMethod.isReturningArray (Miroslav Bajtoš)

 * Remove ext/swagger (Miroslav Bajtoš)

 * 2.0.0-beta4 (Miroslav Bajtoš)

 * 2.0.0-beta3 (Miroslav Bajtoš)

 * Exclude body-parser from the browser bundle (Miroslav Bajtoš)

 * Remove duplicate dep (Raymond Feng)

 * Add more tests and use eql for readability (Raymond Feng)

 * Add more comments (Raymond Feng)

 * Sort the routes so that methods can be resolved in order (Raymond Feng)

 * Upgrade to express 4.x (Raymond Feng)


2014-08-07, Version 1.5.3
=========================

 * Fix failing test (Raymond Feng)

 * Upgrade qs dep (Raymond Feng)

 * rest: use `app.delete` instead of `app.del` (Miroslav Bajtoš)


2014-07-28, Version 2.0.2
=========================

 * Bump version (Raymond Feng)

 * Provide an option to configure if stack trace should be disabled (Raymond Feng)

 * Remove stack traces from production errors. (Samuel Reed)

 * Update test case to remove usage of deprecated express apis (Raymond Feng)


2014-07-24, Version 2.0.1
=========================

 * rest: fix RestMethod.isReturningArray (Miroslav Bajtoš)


2014-07-22, Version 2.0.0
=========================

 * Remove ext/swagger (Miroslav Bajtoš)


2014-07-16, Version 2.0.0-beta5
===============================

 * 2.0.0-beta4 (Miroslav Bajtoš)

 * 2.0.0-beta3 (Miroslav Bajtoš)

 * Exclude body-parser from the browser bundle (Miroslav Bajtoš)

 * Remove duplicate dep (Raymond Feng)

 * Bump version (Raymond Feng)

 * Add more tests and use eql for readability (Raymond Feng)

 * Add more comments (Raymond Feng)

 * Sort the routes so that methods can be resolved in order (Raymond Feng)

 * Upgrade to express 4.x (Raymond Feng)


2014-07-16, Version 1.5.2
=========================

 * rest: use `app.delete` instead of `app.del` (Miroslav Bajtoš)


2014-07-11, Version 1.5.1
=========================

 * Bump version and update deps (Raymond Feng)

 * Skip properties that are shared model classes (Raymond Feng)

 * Fix typo (Rand McKinney)

 * Fix typo in doc link (Rand McKinney)

 * swagger: fix filtering of non-settable args (Miroslav Bajtoš)

 * Don't show derived parameters in param lists. (Samuel Reed)

 * Update link to doc (Rand McKinney)


2014-06-13, Version 2.0.0-beta4
===============================

 * 2.0.0-beta4 (Miroslav Bajtoš)

 * Add more classes to JSDocs; some doc cleanup. (crandmck)

 * !fixup use strongloop/node.js literal convention (Ritchie Martori)

 * !fixup isDelegate tests (Ritchie Martori)

 * Add test for `sharedClass.find(name)` (Ritchie Martori)

 * Rename willInvoke => isDelegateFor (Ritchie Martori)

 * Add sharedMethod aliases (Ritchie Martori)

 * Add sharedMethod.willInvoke(suspect) (Ritchie Martori)

 * Add alias for defineType / convert for backwards compat. (Ritchie Martori)

 * Add test for scope fix (Ritchie Martori)

 * Rename .convert() to defineType (Ritchie Martori)

 * Fix convert() example (Ritchie Martori)

 * Add test for removing sharedCtor requirement (Ritchie Martori)

 * Make intent more clear for ctor.http copy (Ritchie Martori)

 * Remove un-tested options (Ritchie Martori)

 * Use nextTick over setTimeout (Ritchie Martori)

 * Add backwards compatibility to SharedMethod ctor (Ritchie Martori)


2014-06-03, Version 2.0.0-beta3
===============================

 * 2.0.0-beta3 (Miroslav Bajtoš)

 * Exclude body-parser from the browser bundle (Miroslav Bajtoš)

 * Remove duplicate dep (Raymond Feng)


2014-05-30, Version 2.0.0-beta2
===============================

 * Bump version (Raymond Feng)

 * Add more tests and use eql for readability (Raymond Feng)

 * Add more comments (Raymond Feng)

 * Sort the routes so that methods can be resolved in order (Raymond Feng)

 * Upgrade to express 4.x (Raymond Feng)


2014-05-30, Version 1.4.3
=========================

 * Add alias for defineType / convert for backwards compat. (Ritchie Martori)


2014-05-29, Version 1.4.2
=========================

 * Add test for scope fix (Ritchie Martori)

 * Rename .convert() to defineType (Ritchie Martori)

 * Fix convert() example (Ritchie Martori)

 * Add test for removing sharedCtor requirement (Ritchie Martori)

 * Make intent more clear for ctor.http copy (Ritchie Martori)

 * Remove un-tested options (Ritchie Martori)

 * Use nextTick over setTimeout (Ritchie Martori)

 * Add backwards compatibility to SharedMethod ctor (Ritchie Martori)


2014-05-29, Version 2.0.0-beta1
===============================

 * Upgrade to express 4.x (Raymond Feng)


2014-05-21, Version 1.4.1
=========================

 * Ensure methods that are discovered are unique (Ritchie Martori)

 * Fix swagger breaking on array type from LB (Ritchie Martori)

 * doc: add CONTRIBUTING.md and LICENSE.md (Ben Noordhuis)

 * Update deps (Raymond Feng)


2014-05-20, Version 1.4.0
=========================

 * - Add query string support for client side method invocation  - Invoke the sharedMethod using the correct scope  - Filter out methods that are not shared  - Do not require fn to be passed to `SharedMethod` (Ritchie Martori)

 * Refactor SharedClass / SharedMethod (Ritchie Martori)

 * Add APIs for manually adding classes and methods (Ritchie Martori)

 * Only coerce when an object exists (Ritchie Martori)

 * !fixup empty string should be converted to false for Booleans (Ritchie Martori)

 * !fixup name converter functions (Ritchie Martori)

 * !fixup Dont convert falsy (other than 0) to Number (Ritchie Martori)

 * Fix Invokation typo (Ritchie Martori)

 * !fixup Number conversion tests (Ritchie Martori)

 * !fixup improve boolean conversion and add tests (Ritchie Martori)

 * Ignore syntax errors for responses with no content (Ritchie Martori)

 * !fixup fixes incorrect array acceptance (Ritchie Martori)


2014-05-13, Version 1.3.4
=========================

 * Bump cors module version to ~2.3.1 (Alberto Leal)


2014-05-05, Version 1.3.3
=========================

 * Bump version (Raymond Feng)

 * Fix issue #38: Use res.json() when the accept is application/json instead of res.jsonp(). (Alberto Leal)

 * Fix #56 (Alex Pica)


2014-04-16, Version 1.3.2
=========================

 * Remove X-Powered-By header (Alex)


2014-03-27, Version 1.3.1
=========================

 * Add browser e2e tests (Ritchie Martori)

 * Initial browser testing (Ritchie Martori)

 * fixup! Remove hardcoded port in tests (Ritchie Martori)

 * fixup! Copy error properties (Ritchie Martori)

 * fixup! Incorrect strict logic (Ritchie Martori)

 * fixup! Set correct verb (Ritchie Martori)

 * Initial browser / node client (Ritchie Martori)

 * HttpInvokation tests (Ritchie Martori)

 * Add initial tests and implementation (Ritchie Martori)


2014-03-27, Version 1.3.0
=========================

 * Add a test case for custom argument parsing (Raymond Feng)


2014-02-21, Version 1.2.7
=========================

 * Bump version (Raymond Feng)

 * Capture JSON.parse errors (Raymond Feng)

 * Handle undefined argument type (Miroslav Bajtoš)


2014-02-21, Version 1.2.5
=========================



2014-02-21, Version 1.2.6
=========================

 * Handle undefined argument type (Miroslav Bajtoš)

 * Bump version (Raymond Feng)

 * Test jsonrpc limit (Raymond Feng)

 * Allows options to be passed for remoting middlewares (Raymond Feng)

 * Apply Dual MIT/StrongLoop license (Sam Roberts)

 * Set X-Powered-By to LoopBack (Raymond Feng)


2014-01-31, Version 1.2.4
=========================

 * Bump version (Raymond Feng)

 * Use req.protocol instead of hard-coded http (Raymond Feng)

 * Handles the null return value (Raymond Feng)

 * Fix the handling of accept header for jsonp (Raymond Feng)

 * Enhance the test case to make the output simpler (Raymond Feng)


2014-01-30, Version 1.2.2
=========================



2014-01-30, Version 1.2.3
=========================

 * Bump version (Raymond Feng)

 * Handles the null return value (Raymond Feng)

 * Fix the handling of accept header for jsonp (Raymond Feng)

 * Enhance the test case to make the output simpler (Raymond Feng)

 * Bump version and update test deps (Raymond Feng)

 * Add jsonp support and a cursory test (Chris S)


2014-01-27, Version 1.2.1
=========================

 * Clean up RestAdapter, add RestClass and RestMethod (Miroslav Bajtoš)

 * Replace old README with link to docs. (Rand McKinney)

 * Add ctor.http to SharedClass (Miroslav Bajtoš)


2014-01-13, Version 1.1.8
=========================

 * Bump version (Raymond Feng)

 * Remove commented out code (Raymond Feng)

 * Fix the typo (Raymond Feng)

 * Allow context argument (Raymond Feng)

 * Skip req/res during conversion (Raymond Feng)

 * Use traverse to handle $type/$data (Raymond Feng)


2014-01-06, Version 1.1.7
=========================

 * Add undefined arg test and fix hanging handler (Ritchie Martori)


2014-01-06, Version 1.1.6
=========================

 * Missing arg should return a 400 not 500 (Ritchie Martori)


2013-12-19, Version 1.1.5
=========================

 * Bump version (Raymond Feng)

 * Fix the form param handling (Raymond Feng)

 * Make sure http source is honored for query/path (Raymond Feng)

 * Bump express for __proto__ fixes (Ryan Graham)


2013-12-04, Version 1.1.4
=========================

 * Bump version (Ritchie Martori)

 * Add a test case for the 'skip superclass' fix (Raymond Feng)

 * Modify RestAdapter to own the whole URL space (Miroslav Bajtos)

 * ext/swagger supports non-root location of REST API (Miroslav Bajtos)

 * test: extract createSharedClass to helper file (Miroslav Bajtos)


2013-12-01, Version 1.1.3
=========================

 * Bump version (Raymond Feng)

 * Skip the super class (Raymond Feng)

 * Include additional properties in error responses (Miroslav Bajtos)

 * Return 404 for unknown methods of known classes (Miroslav Bajtos)

 * Add rest.before and rest.after hooks. (Miroslav Bajtos)

 * Include full error stack in debug logs (Miroslav Bajtos)

 * Clean up `RestAdapter.prototype.createHandler()` (Miroslav Bajtos)

 * Clean up rest tests, cover prototype methods too (Miroslav Bajtos)

 * Rename server.test.js to rest.test.js (Miroslav Bajtos)

 * Add /coverage/ to .gitignore (Miroslav Bajtos)

 * Add .jshintignore (Miroslav Bajtos)

 * Update docs.json (Rand McKinney)

 * Add jshint configuration. (Miroslav Bajtos)


2013-11-18, Version 1.1.2
=========================

 * Bump version (Ritchie Martori)

 * Better error handling (Ritchie Martori)

 * Remove bodyParser from jsonrpc-adapter (Ritchie Martori)

 * Remove bodyParser in favor of json / url parsers (Ritchie Martori)

 * Bump version and update deps (Raymond Feng)

 * Increase the max number of listeners (Raymond Feng)

 * Added missing return on SharedMethod.prototype.invoke, to support streams, and enforced application/json content-type. This needs to be made configurable. (Stephen Belanger)

 * Fix broken link to iOS strong-remoting-client (Rand McKinney)

 * Failing streams test (Stephen Belanger)

 * Implement json-rpc protocol (Raymond Feng)

 * Add keywords to package.json (Raymond Feng)

 * Add repo (Raymond Feng)

 * Finalize package.json for sls-1.0.0 (Raymond Feng)


2013-09-11, Version strongloopsuite-1.0.0-3
===========================================



2013-09-11, Version strongloopsuite-1.0.0-4
===========================================



2013-09-11, Version strongloopsuite-1.0.0-5
===========================================

 * Add debug-guarded errorHandler. (Michael Schoonmaker)

 * Namespace debug. (Michael Schoonmaker)

 * Add keywords to package.json (Raymond Feng)


2013-09-10, Version strongloopsuite-1.0.0-2
===========================================

 * Add repo (Raymond Feng)

 * Finalize package.json for sls-1.0.0 (Raymond Feng)


2013-09-04, Version strongloopsuite-1.0.0-1
===========================================



2013-09-04, Version strongloopsuite-1.0.0-0
===========================================



2013-09-04, Version 1.2.0
=========================

 * First release!
