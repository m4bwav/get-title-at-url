// A consumer written in CommonJS: require() of the installed tarball.
'use strict';

const assert = require('node:assert/strict');
const process = require('node:process');
const library = require('get-title-at-url');

const base = process.argv[2];

assert.equal(typeof library, 'object');
assert.equal(typeof library.getTitleAtUrl, 'function');
assert.equal(library.default, library.getTitleAtUrl, 'default and getTitleAtUrl are the same function');
assert.match(require.resolve('get-title-at-url'), /[/\\]dist[/\\]index\.cjs$/u, 'require resolves to the CommonJS build');
assert.equal(library.extractTitle('<title>Hello | Site</title>'), 'Hello');

(async () => {
  assert.deepEqual(await library.getTitleAtUrl(`${base}/ok`), {title: 'Fixture Page', url: `${base}/ok`, status: 200});

  const missing = await library.getTitleAtUrl(`${base}/not-found`);
  assert.ok(missing.error instanceof library.GetTitleError, 'errors are instances of the exported GetTitleError');
  assert.equal(missing.error.code, 'HTTP_ERROR');
  assert.equal(missing.status, 404);

  console.log('cjs-node ok');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
