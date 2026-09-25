import {readFileSync, writeFileSync} from 'node:fs';
import {defineConfig} from 'tsdown';

const {version} = JSON.parse(readFileSync('package.json', 'utf8')) as {version: string};

// The library reads its version for the User-Agent header from this constant, so it never touches the file system.
// eslint-disable-next-line @typescript-eslint/naming-convention -- a build-time constant, named like one
const define = {PACKAGE_VERSION: JSON.stringify(version)};

// With `sourcemap: true` the declaration files still end in a sourceMappingURL comment although no declaration map is written (tsdown 0.23.0); drop the dangling reference.
function dropDeclarationMapComments(): void {
  for (const file of ['dist/index.d.mts', 'dist/index.d.cts']) {
    writeFileSync(file, readFileSync(file, 'utf8').replace(/\n\/\/# sourceMappingURL=\S+$/u, '\n'));
  }
}

export default defineConfig([
  // The library: ESM and CommonJS with a declaration file for each. `exports: true` writes main, module, types and exports into package.json.
  {
    entry: {index: 'src/index.ts'},
    format: ['esm', 'cjs'],
    platform: 'neutral',
    // No declaration maps: they would point into src/, which is not published.
    dts: {sourcemap: false},
    fixedExtension: true,
    exports: true,
    sourcemap: true,
    // The CommonJS build then exports getTitleAtUrl, default, extractTitle and GetTitleError, the same names as the ESM build.
    // The JSDoc lives in the declaration files, where editors read it; dropping it from the JavaScript keeps the tarball small.
    outputOptions: {exports: 'named', comments: {jsdoc: false}},
    define,
    hooks: {'build:done': dropDeclarationMapComments},
  },
  // The CLI: one self-contained ESM file with its shebang, reachable through `bin` only (an `exports` entry here would add a ./cli subpath that attw rejects).
  {
    entry: {cli: 'src/cli.ts'},
    format: 'esm',
    platform: 'node',
    dts: false,
    outputOptions: {comments: {jsdoc: false}},
    fixedExtension: true,
    sourcemap: true,
    define,
  },
]);
