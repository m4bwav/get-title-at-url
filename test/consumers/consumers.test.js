/*
Consumer fixtures: pack the package, install the tarball into a scratch project outside the repository, and use each published artifact the way a consumer would. Needs the network once to install TypeScript and the Node types into that project (the npm cache usually has them).
*/
import assert from 'node:assert/strict';
import {exec, execFile} from 'node:child_process';
import {
  access,
  cp,
  mkdtemp,
  rm,
  writeFile,
} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import path from 'node:path';
import process from 'node:process';
import {after, before, test} from 'node:test';
import {fileURLToPath} from 'node:url';
import {startFixtureServer} from '../helpers/fixture-server.js';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('../..', import.meta.url));
const fixtures = fileURLToPath(new URL('.', import.meta.url));

const RUNTIME_FIXTURES = ['esm-node', 'cjs-node'];
const TYPE_FIXTURES = ['ts-nodenext-esm', 'ts-nodenext-cjs', 'ts-bundler', 'ts-node10'];

let workspace;
let server;

function settle(error, stdout, stderr) {
  return {
    code: error ? (error.code ?? 1) : 0, stdout, stderr, output: `${stdout}${stderr}`,
  };
}

// A shell command: npm and npx are .cmd shims on Windows, which only run through a shell.
function shell(command, cwd) {
  return new Promise(resolve => {
    exec(command, {cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024}, (error, stdout, stderr) => {
      resolve(settle(error, stdout, stderr));
    });
  });
}

function node(arguments_, cwd) {
  return new Promise(resolve => {
    execFile(process.execPath, arguments_, {cwd, encoding: 'utf8'}, (error, stdout, stderr) => {
      resolve(settle(error, stdout, stderr));
    });
  });
}

async function mustSucceed(step, result) {
  const settled = await result;
  assert.equal(settled.code, 0, `${step} failed:\n${settled.output}`);
  return settled;
}

before(async () => {
  workspace = await mkdtemp(path.join(tmpdir(), 'get-title-at-url-consumers-'));
  // Build, then pack without lifecycle scripts so stdout holds only npm's JSON.
  await mustSucceed('npm run build', shell('npm run build', root));
  const packed = await mustSucceed('npm pack', shell(`npm pack --json --ignore-scripts --pack-destination "${workspace}"`, root));
  const [{filename}] = JSON.parse(packed.stdout);

  await writeFile(path.join(workspace, 'package.json'), `${JSON.stringify({name: 'consumer-workspace', private: true}, undefined, 2)}\n`);
  const typescript = require('typescript/package.json').version;
  const nodeTypes = require('@types/node/package.json').version;
  await mustSucceed('npm install', shell(`npm install --no-audit --no-fund --prefer-offline "./${filename}" typescript@${typescript} @types/node@${nodeTypes}`, workspace));

  for (const fixture of [...RUNTIME_FIXTURES, ...TYPE_FIXTURES]) {
    await cp(path.join(fixtures, fixture), path.join(workspace, fixture), {recursive: true});
  }

  for (const fixture of TYPE_FIXTURES) {
    await cp(path.join(fixtures, 'types', 'assertions.ts'), path.join(workspace, fixture, 'index.ts'));
  }

  server = await startFixtureServer();
});

after(async () => {
  await server?.close();
  if (workspace && process.env.KEEP_CONSUMER_WORKSPACE === undefined) {
    await rm(workspace, {recursive: true, force: true});
  } else if (workspace) {
    console.log(`consumer workspace kept at ${workspace}`);
  }
});

test('esm-node: default and named imports from an ES module', async () => {
  const result = await node(['esm-node/index.js', server.url], workspace);
  assert.equal(result.code, 0, result.output);
  assert.equal(result.stdout.trim(), 'esm-node ok');
});

test('cjs-node: require() from a CommonJS module', async () => {
  const result = await node(['cjs-node/index.js', server.url], workspace);
  assert.equal(result.code, 0, result.output);
  assert.equal(result.stdout.trim(), 'cjs-node ok');
});

for (const fixture of TYPE_FIXTURES) {
  test(`${fixture}: the declaration files type-check`, async () => {
    const tsc = path.join(workspace, 'node_modules', 'typescript', 'bin', 'tsc');
    const result = await node([tsc, '--project', fixture], workspace);
    assert.equal(result.code, 0, result.output);
  });
}

test('bin: npx runs the installed get-title-at-url command', async () => {
  if (process.platform === 'win32') {
    await access(path.join(workspace, 'node_modules', '.bin', 'get-title-at-url.cmd'));
  }

  // --no: never download; the command must come from the installed tarball.
  const result = await shell(`npx --no get-title-at-url ${server.url}/ok`, workspace);
  assert.equal(result.code, 0, result.output);
  assert.equal(result.stdout.trim(), 'Fixture Page');
});
