// A consumer written as an ES module: default and named imports of the installed tarball.
import assert from 'node:assert/strict';
import process from 'node:process';
import getTitleAtUrl, {extractTitle, GetTitleError, getTitleAtUrl as named} from 'get-title-at-url';

const base = process.argv[2];

assert.equal(typeof getTitleAtUrl, 'function');
assert.equal(getTitleAtUrl, named, 'the default export is the named export');
if (typeof import.meta.resolve === 'function') {
  assert.match(import.meta.resolve('get-title-at-url'), /\/dist\/index\.mjs$/u, 'import resolves to the ESM build');
}

assert.equal(extractTitle('<title>Hello | Site</title>'), 'Hello');
assert.deepEqual(await getTitleAtUrl(`${base}/ok`), {title: 'Fixture Page', url: `${base}/ok`, status: 200});

const missing = await getTitleAtUrl(`${base}/not-found`);
assert.ok(missing.error instanceof GetTitleError, 'errors are instances of the exported GetTitleError');
assert.equal(missing.error.code, 'HTTP_ERROR');
assert.equal(missing.status, 404);

console.log('esm-node ok');
