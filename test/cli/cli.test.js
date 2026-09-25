import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import process from 'node:process';
import {after, before, test} from 'node:test';
import {fileURLToPath} from 'node:url';
import {version} from '../helpers/builds.js';
import {startFixtureServer} from '../helpers/fixture-server.js';

const cli = fileURLToPath(new URL('../../dist/cli.mjs', import.meta.url));

let server;

before(async () => {
  server = await startFixtureServer();
});

after(async () => {
  await server.close();
});

function run(...arguments_) {
  return new Promise(resolve => {
    execFile(process.execPath, [cli, ...arguments_], {encoding: 'utf8'}, (error, stdout, stderr) => {
      resolve({code: error ? error.code : 0, stdout, stderr});
    });
  });
}

test('the first line of dist/cli.mjs is the shebang', async () => {
  const [firstLine] = (await readFile(cli, 'utf8')).split('\n', 1);
  assert.equal(firstLine, '#!/usr/bin/env node');
});

test('prints the title on stdout and exits 0', async () => {
  const {code, stdout, stderr} = await run(`${server.url}/ok`);
  assert.equal(code, 0);
  assert.equal(stdout, 'Fixture Page\n');
  assert.equal(stderr, '');
});

test('a 404 prints "error: <message>" on stderr and exits 1', async () => {
  const {code, stdout, stderr} = await run(`${server.url}/not-found`);
  assert.equal(code, 1);
  assert.equal(stdout, '');
  assert.equal(stderr, 'error: HTTP 404 Not Found\n');
});

test('an invalid URL exits 1 with the reason', async () => {
  const {code, stderr} = await run('example.com');
  assert.equal(code, 1);
  assert.equal(stderr, 'error: Invalid URL "example.com": expected an absolute http: or https: URL\n');
});

test('no URL prints the usage on stderr and exits 2', async () => {
  const {code, stdout, stderr} = await run();
  assert.equal(code, 2);
  assert.equal(stdout, '');
  assert.match(stderr, /^error: a URL is required\n/u);
  assert.match(stderr, /Usage/u);
});

test('two URLs, an unknown option, or a bad --timeout exit 2', async () => {
  assert.equal((await run(`${server.url}/ok`, `${server.url}/ok`)).code, 2);
  const unknown = await run('--nope', `${server.url}/ok`);
  assert.equal(unknown.code, 2);
  assert.match(unknown.stderr, /--nope/u);
  for (const timeout of ['--timeout=abc', '--timeout=0', '--timeout=-5']) {
    const bad = await run(timeout, `${server.url}/ok`);
    assert.equal(bad.code, 2, timeout);
    assert.match(bad.stderr, /--timeout takes a positive number of milliseconds/u);
  }
});

test('--help and -h print the usage on stdout and exit 0', async () => {
  for (const flag of ['--help', '-h']) {
    const {code, stdout} = await run(flag);
    assert.equal(code, 0);
    assert.match(stdout, /Usage\n\s+\$ get-title-at-url <url>/u);
  }
});

test('--version and -v print the package.json version', async () => {
  for (const flag of ['--version', '-v']) {
    const {code, stdout} = await run(flag);
    assert.equal(code, 0);
    assert.equal(stdout, `${version}\n`);
  }
});

test('--json prints the whole result', async () => {
  const {code, stdout} = await run('--json', `${server.url}/ok`);
  assert.equal(code, 0);
  assert.deepEqual(JSON.parse(stdout), {title: 'Fixture Page', url: `${server.url}/ok`, status: 200});
});

test('--json on a failure prints the error object on stdout and exits 1', async () => {
  const {code, stdout} = await run(`${server.url}/not-found`, '--json');
  assert.equal(code, 1);
  const result = JSON.parse(stdout);
  assert.equal(result.error.code, 'HTTP_ERROR');
  assert.equal(result.status, 404);
});

test('--timeout against a slow page exits 1 with TIMEOUT', async () => {
  const plain = await run('--timeout', '50', `${server.url}/slow`);
  assert.equal(plain.code, 1);
  assert.equal(plain.stderr, 'error: Timed out after 50 ms\n');
  const json = await run('--timeout=50', '--json', `${server.url}/slow`);
  assert.equal(json.code, 1);
  assert.equal(JSON.parse(json.stdout).error.code, 'TIMEOUT');
});
