import assert from 'node:assert/strict';
import {exec} from 'node:child_process';
import {access, readFile} from 'node:fs/promises';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));
const read = file => readFile(new URL(`../../${file}`, import.meta.url), 'utf8');
const packageJson = JSON.parse(await read('package.json'));

const PUBLISHED_FILES = [
  'CHANGELOG.md',
  'LICENSE',
  'README.md',
  // Dist/cli.mjs.map stays out (files has !dist/cli.mjs.map): the CLI bundles the library, whose own maps ship.
  'dist/cli.mjs',
  'dist/index.cjs',
  'dist/index.cjs.map',
  'dist/index.d.cts',
  'dist/index.d.mts',
  'dist/index.mjs',
  'dist/index.mjs.map',
  'package.json',
];

// The plan set 40 kB; the two library source maps, which carry the TypeScript source so debuggers and bundlers can show it, put the tarball at about 40 kB, so the budget is 50 kB (see the log, 2026-09-25).
const TARBALL_BUDGET = 50_000;

test('the tarball holds exactly the built files and the docs, and stays under the size budget', async () => {
  // --ignore-scripts: prepack would rebuild dist/ while the other test files are reading it.
  const stdout = await new Promise((resolve, reject) => {
    exec('npm pack --dry-run --json --ignore-scripts', {cwd: root, encoding: 'utf8'}, (error, output) => {
      if (error) {
        reject(error);
      } else {
        resolve(output);
      }
    });
  });
  const [packed] = JSON.parse(stdout);
  assert.deepEqual(new Set(packed.files.map(file => file.path)), new Set(PUBLISHED_FILES));
  assert.ok(packed.size < TARBALL_BUDGET, `the tarball is ${packed.size} bytes`);
});

test('package.json: entry points exist, no runtime dependencies, Node 20 and up', async () => {
  assert.equal(packageJson.type, 'module');
  assert.deepEqual(packageJson.exports, {
    '.': {import: './dist/index.mjs', require: './dist/index.cjs'},
    './package.json': './package.json',
  });
  assert.equal(packageJson.main, './dist/index.cjs');
  assert.equal(packageJson.module, './dist/index.mjs');
  assert.equal(packageJson.types, './dist/index.d.cts');
  assert.deepEqual(packageJson.bin, {'get-title-at-url': './dist/cli.mjs'});
  for (const file of ['dist/index.mjs', 'dist/index.cjs', 'dist/index.d.mts', 'dist/index.d.cts', 'dist/cli.mjs']) {
    await access(new URL(`../../${file}`, import.meta.url));
  }

  assert.deepEqual(packageJson.dependencies ?? {}, {});
  assert.equal(packageJson.engines.node, '>=20');
  assert.equal(packageJson.sideEffects, false);
  assert.equal(packageJson.repository.url, 'git+https://github.com/m4bwav/get-title-at-url.git');
});

test('the library builds use nothing Node-specific, so they run in browsers, Deno, Bun and edge runtimes', async () => {
  for (const file of ['dist/index.mjs', 'dist/index.cjs']) {
    const code = await read(file);
    assert.doesNotMatch(code, /\bnode:/u, `${file} imports a node: module`);
    assert.doesNotMatch(code, /\brequire\(/u, `${file} calls require()`);
    assert.doesNotMatch(code, /\bprocess\./u, `${file} uses process`);
    assert.doesNotMatch(code, /\bBuffer\b/u, `${file} uses Buffer`);
    assert.doesNotMatch(code, /\b__(?:dirname|filename)\b/u, `${file} uses __dirname or __filename`);
  }
});

test('the declaration files need no Node types', async () => {
  for (const file of ['dist/index.d.mts', 'dist/index.d.cts']) {
    const types = await read(file);
    assert.doesNotMatch(types, /\bNodeJS\.|\bBuffer\b|node:|reference types=/u, file);
    assert.doesNotMatch(types, /sourceMappingURL/u, `${file} points at a declaration map that is not published`);
  }
});

test('the declaration files for ESM and CommonJS describe the same API', async () => {
  const [esm, cjs] = await Promise.all([read('dist/index.d.mts'), read('dist/index.d.cts')]);
  assert.equal(esm, cjs);
});
