2019-05-10, Version 3.14.0
==========================

 * chore: update copyright years (Diana Lau)

 * update README for LTS status (Diana Lau)

 * Enable Node.js 12.x on Travis CI (Miroslav Bajtoš)


2019-01-11, Version 3.13.2
==========================

 * Fixate event-stream version to 3.3.1 (Miroslav Bajtoš)


2018-10-15, Version 3.13.1
==========================

 * Update LTS status (Miroslav Bajtoš)

 * Removed extra whitespace (Josué Morales)

 * style: fix linting (virkt25)


2018-07-09, Version 3.13.0
==========================

 * [WebFM] cs/pl/ru translation (candytangnb)


2018-06-25, Version 3.12.1
==========================

 * Delete remote hooks when class is deleted (MohammedEssehemy)

 * Upgrade dependencies to their latest versions (shimks)


2018-06-12, Version 3.12.0
==========================

 * Disable package-lock feature of npm (Miroslav Bajtoš)

 * Upgrade dependencies to latest versions (Miroslav Bajtoš)

 * Upgrade chai & dirty-chai to latest (Miroslav Bajtoš)

 * Upgrade js2xmlparser to latest (Miroslav Bajtoš)

 * Upgrade mocha to latest (Miroslav Bajtoš)

 * Travis: add Node.js 10.x to the build matrix (Miroslav Bajtoš)

 * Drop support for Node 4.x (Miroslav Bajtoš)


2018-04-17, Version 3.11.0
==========================

 * feat: remove shared class & type converter (Miroslav Bajtoš)


2018-02-19, Version 3.10.0
==========================

 * Upgrade jayson from 1.x to 2.x (Miroslav Bajtoš)


2018-01-30, Version 3.9.0
=========================

 * chore: upgrade dependencies (Raymond Feng)


2018-01-29, Version 3.8.1
=========================

 * Fix formatting in lib/remote-objects (Miroslav Bajtoš)

 * Fix typo in status code check (Zak Barbuto)

 * Simplify build, fix Node.js 4.x (Miroslav Bajtoš)

 * Fix linting issues in examples (Miroslav Bajtoš)

 * fixup! add top-level dep on eslint-plugin-mocha (Miroslav Bajtoš)

 * Update eslint and eslint-config to latest (Miroslav Bajtoš)


2017-12-08, Version 3.8.0
=========================

 * Avoid setting Content-Type on 304 (Zak Barbuto)


2017-12-05, Version 3.7.0
=========================

 * Add support for pass-through authentication (Kenny Sabir)

 * Update LICENSE.md (Diana Lau)

 * CODEOWNERS: move @lehni to Alumni section (Miroslav Bajtoš)


2017-10-17, Version 3.6.0
=========================

 * update dependencies (Diana Lau)


2017-10-13, Version 3.5.0
=========================

 * update strong-globalize to 3.1.0 (shimks)

 * translation return for Q4 drop1 (tangyinb)

 * Update minimum request version to 2.83 (Quentin RIBIERRE)

 * CODEOWNERS: add zbarbuto (Miroslav Bajtoš)

 * update globalize string (Diana Lau)


2017-09-11, Version 3.4.1
=========================

 * fix: destroy stream result on client close (Young)

 * CODEOWNERS: add lehni (Miroslav Bajtoš)

 * Update Issue and PR Templates (#419) (Sakib Hasan)

 * Update translated strings Q3 2017 (Allen Boone)


2017-08-03, Version 3.4.0
=========================

 * Add support for app-wide "normalizeHttpPath" (Jürg Lehni)

 * update messages.json (Diana Lau)

 * fixes #407 (Dimitris)

 * travis: drop Node.js 7.x, add 8.x (Miroslav Bajtoš)

 * Add CODEOWNERS file (Diana Lau)


2017-06-09, Version 3.3.1
=========================

 * fix crash on invalid `_format` type. Fixes #396 (Samuel Reed)


2017-05-30, Version 3.3.0
=========================

 * Support custom transport/adapter implementations (Piero Maltese)


2017-03-28, Version 3.2.0
=========================

 * Preserve custom remoting metadata (shared methods) (Miroslav Bajtoš)

 * Replicate issue template from loopback (Siddhi Pai)

 * Cache getRestMethodByName (Kenny Sabir)

 * Add nyc coverage, report data to coveralls.io (Miroslav Bajtoš)

 * Fix installation of phantomjs-prebuilt (Miroslav Bajtoš)

 * Upgrade eslint-config, fix new violations (Miroslav Bajtoš)

 * Upgrade eslint-config to 7.x (Miroslav Bajtoš)

 * Use dot reporter in "npm test" (Miroslav Bajtoš)

 * Add "npm run lint" script (Miroslav Bajtoš)


2016-12-21, Version 3.1.1
=========================

 * LB3 release updates (Simon Ho)

 * Update paid support URL (siddhipai)

 * Update paid support URL (Siddhi Pai)


2016-12-01, Version 3.1.0
=========================

 * Implement disabling methods by alias (Rémi Bèges)

 * Add coercion support for geopoint datatype (gunjpan)

 * Update README.md (Rand McKinney)

 * Add Node v7 to Travis CI platforms (Miroslav Bajtoš)

 * Upgrade http-auth to latest (Node v4+ only) (Miroslav Bajtoš)

 * Drop support for Node v0.10 and v0.12 (Miroslav Bajtoš)

 * Update README with correct doc links, etc (Amir Jafarian)

 * Refuse to override builtin file type (Miroslav Bajtoš)

 * Stringify query params which are objects as JSON (Horia Radu)


2016-10-26, Version 3.0.2
=========================

 * allowArray flag for remoteObject `accept` (David Cheung)

 * Adding options to typeConverters functions (David Cheung)

 * lockdown dependency for http-auth (David Cheung)

 * Update ja translation file (Candy)

 * Remove 3.0 RELEASE-NOTES (Miroslav Bajtoš)


2016-10-05, Version 3.0.1
=========================

 * Fix support for hooks returning a Promise (Miroslav Bajtoš)

 * Update translation files - round#2 (Candy)


2016-09-22, Version 3.0.0
=========================

 * Add globalization strings (Amir Jafarian)

 * Don't convert arg values returned by http function (Miroslav Bajtoš)

 * Remove built-in CORS middleware (Miroslav Bajtoš)

 * Fix API docs for HttpInvocation (Miroslav Bajtoš)

 * Fix API docs in lib/remote-objects (Miroslav Bajtoš)

 * Add missing links to 3.0-RELEASE-NOTES (Miroslav Bajtoš)

 * Detect JSON content-type with parameters (Miroslav Bajtoš)

 * Add rest-coercion tests for custom object types (Miroslav Bajtoš)

 * Reject array/date values for object arguments (Miroslav Bajtoš)

 * Fix rest-coercion of timestamp strings (Miroslav Bajtoš)

 * Fix Date serialization (Miroslav Bajtoš)

 * Add rest-coercion tests for zero-prefixed numbers (Miroslav Bajtoš)


2016-09-09, Version 3.0.0-alpha.6
=================================

 * Rework coercion of input arguments (Miroslav Bajtoš)

 * Fix tests to use res.get instead of res.headers (Miroslav Bajtoš)


2016-08-26, Version 3.0.0-alpha.5
=================================

 * Update dependencies (Miroslav Bajtoš)

 * Remove the usage of deprecated methods (Amir Jafarian)

 * Revert globalization of assert() messages (Miroslav Bajtoš)


2016-08-11, Version 3.0.0-alpha.4
=================================

 * Add globalization (deepakrkris)

 * Introduce support for integer datatype (gunjpan)

 * Update URLs in CONTRIBUTING.md (#321) (Ryan Graham)

 * Prioritise auth errors over sharedCtor errors (Miroslav Bajtoš)

 * Fix style violations introduced by a1b156b9 (Miroslav Bajtoš)

 * Add http source "formData" (Fabian Off)


2016-06-13, Version 3.0.0-alpha.3
=================================

 * Fix integration tests for coercion in REST (Miroslav Bajtoš)

 * Add integration tests for coercion in REST (Miroslav Bajtoš)

 * rest-adapter to use strong-error-handler (David Cheung)

 * Implement getEndpoints (Amir Jafarian)

 * travis: add v4 and v6, drop io.js (Miroslav Bajtoš)

 * update copyright notices (Ryan Graham)

 * relicense as Artistic-2.0 only (Ryan Graham)

 * Update README.md (Rand McKinney)

 * Remove reference to jshintrc (Candy)

 * Set to no compression when using change stream (Candy)

 * remove doc files (juehou)

 * Hooks return either promise or callback (juehou)

 * Handle array of errors. (Richard Pringle)

 * Fix linting errors (gunjpan)

 * Auto-update by eslint --fix (gunjpan)

 * Add eslint infrastructure (gunjpan)

 * Fix typo (Candy)

 * Add support for "file" return args (Miroslav Bajtoš)

 * Fix handling of args with http.target:header (Miroslav Bajtoš)


2016-02-24, Version 3.0.0-alpha.2
=================================

 * Do not call "afterError" on success (Miroslav Bajtoš)

 * Change method call to find remote method (Candy)


2016-02-02, Version 3.0.0-alpha.1
=================================

 * Add remotes.registerPhaseHandler (Miroslav Bajtoš)

 * Add remote invocation phases (Miroslav Bajtoš)

 * Simplify invokeMethodInContext (Miroslav Bajtoš)

 * Extract ContextBase and ctx.getScope() (Miroslav Bajtoš)

 * Customize XML root element in remoteMethod (David Cheung)

 * Setup transition to 3.0. (Candy)


2016-01-11, Version 2.24.0
==========================

 * Remove old rest-models example (Ritchie Martori)


2015-12-21, Version 2.23.2
==========================

 * Retain accepted content-type with no-content (David Cheung)

 * Fix incorrect boolean logic on shared-method's `documented` flag. (Samuel Reed)


2015-12-16, Version 2.23.1
==========================

 * Revert "Refactor and rework http coercion." (Miroslav Bajtoš)


2015-12-14, Version 2.23.0
==========================

 * Refactor and rework http coercion. (Samuel Reed)

 * Test case for sharedClass property in restClass (David Cheung)


2015-11-12, Version 2.22.2
==========================

 * Fix issue #251, now default responses are application/json (jaime.franco)

 * Refer to licenses with a link (Sam Roberts)


2015-10-30, Version 2.22.1
==========================

 * Support application/vnd.api+json media type (Richard Walker)


2015-10-21, Version 2.22.0
==========================

 * Modify RestAdapter to allow disabling errorHandler (Richard Walker)

 * Use strongloop conventions for licensing (Sam Roberts)

 * Fix NPM license warning (Simon Ho)


2015-09-18, Version 2.21.0
==========================

 * Add options to `sharedClass.methods()` for including all methods (Ritchie Martori)

 * stringify mockWrapper so we can generate coverage (Ryan Graham)


2015-09-01, Version 2.20.3
==========================

 * Generate wrapper function with same params as the original one (Raymond Feng)


2015-09-01, Version 2.20.2
==========================

 * Fixate jayson version to prevent regression (Miroslav Bajtoš)

 * Strictly depend on jayson@1.2.x (Ritchie Martori)

 * Upgrade Travis to container-based infrastructure (Miroslav Bajtoš)

 * Remove deprecation warning for res.send() (Bram Borggreve)

 * check raw by constructor (yorkie)

 * verify the accepts size <= 5000 (yorkie)


2015-07-31, Version 2.20.1
==========================

 * Explicitly set req.protocol (Ritchie Martori)

 * Update README.md (Rand McKinney)

 * fix long lines in docs that were failing jshint (Ryan Graham)

 * API doc fixes (crandmck)

 * Clean up and fix API docs (crandmck)


2015-07-08, Version 2.20.0
==========================

 * Add support for Event Source streams (Ritchie Martori)

 * Add object mode ReadableStream support (Ritchie Martori)

 * Update http-context.js (Rand McKinney)

 * HttpContext: do not lowercase type when resolving dynamic converter (Jorrit Schippers)

 * Rest Test: fixed express deprecation warning (Jorrit Schippers)


2015-06-23, Version 2.19.0
==========================

 * Fix iojs error in tests (Ritchie Martori)

 * err.status should have precedence over default errorStatus (Ritchie Martori)

 * Add support for declaring status code defaults (Ritchie Martori)

 * support type string "array" (Pradnya Baviskar)


2015-05-19, Version 2.18.1
==========================

 * Upgrade deps (Raymond Feng)


2015-05-12, Version 2.18.0
==========================

 * Add authorization hook (Ritchie Martori)


2015-05-06, Version 2.17.0
==========================

 * Support arg type "array" (Miroslav Bajtoš)


2015-04-28, Version 2.16.3
==========================

 * Cleanup in coercion code (Miroslav Bajtoš)

 * shared-method: relax handling of type strings (Miroslav Bajtoš)

 * shared-method: tighten coercion and type checks (Miroslav Bajtoš)

 * test: report invocation errors (Miroslav Bajtoš)


2015-04-20, Version 2.16.2
==========================

 * Fix array coercion for non-array target type (Miroslav Bajtoš)

 * Enable Travis CI for this project (Miroslav Bajtoš)


2015-04-14, Version 2.16.1
==========================

 * Fix typo introduced in fca2fb0 (Miroslav Bajtoš)

 * Fix improper type coercions, especially on array types. (Samuel Reed)


2015-04-14, Version 2.16.0
==========================

 * http-context: save "ctorArgs" on the context (Miroslav Bajtoš)

 * Expose HttpContext as `req.remotingContext` (Miroslav Bajtoš)

 * Fix lint errors (Miroslav Bajtoš)


2015-04-02, Version 2.15.0
==========================

 * Remove request-browser (Ritchie Martori)

 * Forward invocation error details (Miroslav Bajtoš)

 * Implement "afterError" hook (Miroslav Bajtoš)


2015-03-30, Version 2.14.1
==========================

 * Do not require instanceof check for type assertion (Ritchie Martori)

 * browser: remove packages used by server only (Miroslav Bajtoš)


2015-03-10, Version 2.14.0
==========================

 * Disable CORS when the config value is false (claylo)

 * Fix JSCS errors (Simon Ho)

 * Coerce empty string into empty array with arrayItemDelimiters (Samuel Reed)


2015-02-25, Version 2.13.2
==========================

 * Preserve non-200 status when no content will be sent (Pradnya Baviskar)

 * Update README.md (Rand McKinney)


2015-02-23, Version 2.13.1
==========================

 * Add proper bearer token support and tests (Ritchie Martori)


2015-02-18, Version 2.13.0
==========================

 * Improve coercion for untyped args (Ritchie Martori)

 * Do not depend on req.body (Ritchie Martori)

 * Add remotes.auth / authorization support (Ritchie Martori)

 * Another small fix (Rand McKinney)

 * Small fix (Rand McKinney)

 * Move content from docs.strongloop.com back here. (Rand McKinney)

 * Allow promises to resolve with a single arg (Miroslav Bajtoš)

 * Fix link to docs (Ritchie Martori)

 * Support Promise-returning method and hooks (Miroslav Bajtoš)


2015-02-03, Version 2.12.1
==========================

 * Catch unhandled error on current method invocation (Pradnya Baviskar)

 * Fix jscs settings (Miroslav Bajtoš)

 * Remove use of deprecated `req.param()` in express (Seth Etter)

 * Update simple example (Ritchie Martori)

 * Handle Http Invoke Errors Fixes https://github.com/strongloop/strong-remoting/issues/160 (Berkeley Martinez)


2015-01-21, Version 2.12.0
==========================

 * auth: add support for authenticated endpoints (Ryan Graham)

 * test: add tests for http auth support (Ryan Graham)

 * deps: add missing dev dependency grunt-cli (Ryan Graham)


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


2014-08-07, Version 2.0.4
=========================

 * Bump version (Raymond Feng)


2014-08-07, Version 2.0.3
=========================

 * Update deps (especially for qs) (Raymond Feng)

 * Fix the broken sample (Raymond Feng)

 * Improve shared class and method docs (Ritchie Martori)


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

 * Add more classes to JSDocs; some doc cleanup. (crandmck)

 * !fixup use strongloop/node.js literal convention (Ritchie Martori)

 * !fixup isDelegate tests (Ritchie Martori)

 * Add test for `sharedClass.find(name)` (Ritchie Martori)

 * Rename willInvoke => isDelegateFor (Ritchie Martori)

 * 2.0.0-beta3 (Miroslav Bajtoš)

 * Exclude body-parser from the browser bundle (Miroslav Bajtoš)

 * Remove duplicate dep (Raymond Feng)

 * Add sharedMethod aliases (Ritchie Martori)

 * Add sharedMethod.willInvoke(suspect) (Ritchie Martori)

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


2014-06-03, Version 2.0.0-beta3
===============================

 * Exclude body-parser from the browser bundle (Miroslav Bajtoš)

 * Remove duplicate dep (Raymond Feng)


2014-05-30, Version 2.0.0-beta2
===============================

 * Bump version (Raymond Feng)

 * Add more tests and use eql for readability (Raymond Feng)

 * Add more comments (Raymond Feng)

 * Sort the routes so that methods can be resolved in order (Raymond Feng)


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


2014-02-21, Version 1.2.6
=========================

 * Handle undefined argument type (Miroslav Bajtoš)


2014-02-21, Version 1.2.5
=========================

 * Bump version (Raymond Feng)

 * Test jsonrpc limit (Raymond Feng)

 * Allows options to be passed for remoting middlewares (Raymond Feng)

 * Apply Dual MIT/StrongLoop license (Sam Roberts)

 * Set X-Powered-By to LoopBack (Raymond Feng)


2014-01-31, Version 1.2.4
=========================

 * Bump version (Raymond Feng)

 * Use req.protocol instead of hard-coded http (Raymond Feng)


2014-01-30, Version 1.2.3
=========================

 * Bump version (Raymond Feng)

 * Handles the null return value (Raymond Feng)

 * Fix the handling of accept header for jsonp (Raymond Feng)

 * Enhance the test case to make the output simpler (Raymond Feng)


2014-01-30, Version 1.2.2
=========================

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

 * Add debug-guarded errorHandler. (Michael Schoonmaker)

 * Namespace debug. (Michael Schoonmaker)


2013-09-04, Version 1.2.0
=========================



2013-09-04, Version strongloopsuite-1.0.0-1
===========================================



2013-09-04, Version strongloopsuite-1.0.0-0
===========================================

 * First release!
