---
title: "v3 build and test traps: tsdown 0.23, xo 5, npm 11, node:test"
kind: note
status: active
date: 2026-09-25
verified: 2026-09-25
stale_after: 2026-12-25
tags: [v3, tsdown, rolldown, xo, npm, node-test, build, tests, packaging]
aliases: [MIXED_EXPORTS, declaration sourceMappingURL, CHANGELOG not packed, xo fix deleted type assertion, node --test default discovery, parseArgs ambiguous]
summary: "read before changing tsdown.config.ts, xo.config.js, the test scripts or package.json files: every non-obvious choice in the v3 build and test setup and the trap behind it"
---

# v3 build and test traps: tsdown 0.23, xo 5, npm 11, node:test

## Summary

What the v3 build and test setup does that is not obvious from the files, and why, found while writing Stage 1 on 2026-09-25 (tsdown 0.23.0, rolldown 1.2.11, TypeScript 6.0.3, xo 5.0.1, npm 11.16.0, Node 20.20.2, 22.23.3 and 24.18.0). Read before changing the build config, the xo config, the test scripts or the package's `files`.

## Details

Build (tsdown and rolldown)

- tsdown writes a `//# sourceMappingURL=index.d.mts.map` line into both declaration files even with `dts: {sourcemap: false}`, and no map file exists. A `build:done` hook in `tsdown.config.ts` strips it; the package shape test fails if it comes back.
- The CommonJS build with named and default exports makes rolldown warn MIXED_EXPORTS. `outputOptions: {exports: 'named'}` states the chosen shape: `require('get-title-at-url')` returns an object with `getTitleAtUrl`, `default` (the same function), `extractTitle` and `GetTitleError`. It is not callable, so the plan's verification line that expected `function function` now expects `object function`.
- `comments: {jsdoc: false}` drops the JSDoc from the JavaScript output (about 4 kB per file); editors read it from the declaration files, which keep it.
- tsdown rewrites `main`, `module`, `types` and `exports` in `package.json` on every build (`exports: true`) and leaves the file byte-identical when they already match, so the committed file stays stable.
- The version for the User-Agent comes from a `define` of `PACKAGE_VERSION`; the source reads it through `typeof PACKAGE_VERSION === 'string'`, so running the TypeScript directly (JSR, Deno) falls back to `0.0.0-development` instead of throwing.

Package

- npm 11 packs `CHANGELOG.md` only when `files` names it. `files` is `["dist", "!dist/cli.mjs.map", "CHANGELOG.md"]`: the CLI's map duplicates the library's (the CLI bundles the library), but coverage needs it, so it is built and not published.
- The two library maps carry the TypeScript source (`sourcesContent`) and make up most of the tarball: 40.1 kB. The plan's 40 kB budget became 50 kB. Maps without `sourcesContent` would make Vite warn consumers about missing sources, so that option was dropped; not publishing maps at all (about 17 kB) is the other choice, and it is Mark's.

Lint (xo 5)

- `xo --fix` rewrote `const title: undefined = result.title` into plain destructuring, deleting the type assertion it expressed. The type fixture uses `expectType<T>(value)` calls, which the autofix leaves alone; check type tests after any `--fix`.
- `require-unicode-regexp` asks for the `v` flag, a syntax error in Safari 16 and Chrome before 112 that would stop the library loading; `xo.config.js` requires `u` instead. `unicorn/prefer-iterator-to-array` suggests `Iterator#toArray`, which Node 20 lacks; the ES2023 `lib` in `tsconfig.json` rejects it, and the code uses a generator.
- xo's type-aware rules resolve the package's own name through `exports` to `dist/`, so a file that imports `get-title-at-url` lints only after a build. The type fixture is in xo's ignores; a fresh clone runs `npm run lint` before any build (as CI will).
- Every rule turned off, and why, is commented in `xo.config.js`.

Tests

- `node --test` without file arguments treats everything under `test/` as a test file, including the helpers and the consumer fixtures, which fail when run that way. Every npm script names its files.
- Node 20 prints TAP when its output is piped; add `--test-reporter=spec` to compare runs across Node versions.
- `parseArgs` rejects `--timeout -5` as an ambiguous option before the CLI's own check sees it; `--timeout=-5` reaches the check.
- On Windows `npm` and `npx` are `.cmd` shims that `child_process` runs only through a shell, so the tests use `exec` for them and `execFile(process.execPath, ...)` for everything else.
- npm 11.16 warns that `unrs-resolver`'s postinstall (a transitive xo dependency) is not covered by `allowScripts`. The native binding arrives as an optional dependency, so nothing needs approving.

Related: builds on [../plans/2026-09-25-modernization-and-v3-release.md](../plans/2026-09-25-modernization-and-v3-release.md); see also [../solutions/2026-09-25-node-20-textdecoder-decodes-windows-1252-bytes-0x80-0x9f-as-.md](../solutions/2026-09-25-node-20-textdecoder-decodes-windows-1252-bytes-0x80-0x9f-as-.md), [../solutions/2026-09-25-c8-reports-0-for-src-when-include-filters-before-source-maps.md](../solutions/2026-09-25-c8-reports-0-for-src-when-include-filters-before-source-maps.md).
