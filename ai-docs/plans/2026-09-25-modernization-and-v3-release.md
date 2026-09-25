---
title: Modernization and v3 release
kind: plan
status: active
date: 2026-09-25
verified: 2026-09-25
stale_after: never
tags: [v3, plan, npm, github-actions, typescript, tests, release]
summary: "the living plan for get-title-at-url 3.0.0: inventory, target state, decisions D1-D17, v3 API, build specifics, stages 0-4 with dates, test strategy per artifact and environment, PR and issue review, verification checklist, Stage 0 commands"
---

# Modernization and v3.0.0 release plan: get-title-at-url

Living plan. Tick items as they land and put the evidence (commit, PR, workflow run id, npm view output) in [../log.md](../log.md). Dates are absolute. Paths of files that do not exist yet are written without code formatting so the doc lint does not report them as dead; they get their backticks when the files land. Research behind the version numbers and dates: [../notes/2026-09-24-node-npm-ecosystem-september-2026.md](../notes/2026-09-24-node-npm-ecosystem-september-2026.md) and [../notes/2026-09-24-typescript-library-packaging-september-2026.md](../notes/2026-09-24-typescript-library-packaging-september-2026.md). Decision record: [../decisions/2026-09-24-v3-shape-typescript-dual-build-zero-deps.md](../decisions/2026-09-24-v3-shape-typescript-dual-build-zero-deps.md).

## Goal

Ship `get-title-at-url` 3.0.0 to npm so that it is as available as possible:

- Works from `import` (ESM) and `require` (CommonJS), with TypeScript types shipped for both.
- Runs on every supported Node line (20, 22, 24, 26) and, because the core uses only web-standard APIs (`fetch`, `URL`, `TextDecoder`), on Bun, Deno, Cloudflare Workers and browsers too. The HTML-to-title function works anywhere; the URL fetcher works wherever `fetch` exists (browsers will hit CORS on most sites, which is what issue #3 was about, so the README says so).
- Zero runtime dependencies, for the library and for the CLI (D17: `parseArgs` from `node:util` replaces `meow`).
- Published from GitHub Actions with npm trusted publishing and provenance, a GitHub Release per version, a changelog, CI on every push and pull request, Dependabot for npm and Actions, and none of the dead services (Travis, Coveralls, Codecov, Snyk, Gitter).
- Documented for handoff: README rewritten, `AGENTS.md` with a `CLAUDE.md` import and a Copilot pointer, `ai-docs/` kept current.

## Status

2026-09-25: plan written from the 2026-09-24 inventory and research. Mark read the decisions table and kept every recommendation. Stage 0's agent tasks are done (bot PRs closed, stale branches, webhooks and dead settings gone; evidence in the log); Mark's two browser tasks (uninstall Snyk, confirm npm 2FA) are still open. Stage 1 is written and verified on branch `v3`: lint, types, build, 186 tests, publint, attw, coverage 100 percent, 7 consumer fixtures and the live smoke all pass on Node 24, the suites also on Node 20 and 22, and from a fresh clone. The Stage 1 notes list where the build departs from this plan. Later on 2026-09-25 Mark said to push everything and hand the rest of the plan to a new session: `v3` is on GitHub (`origin/v3`) and the pull request is the next step. Mark did not answer the two open points in the Stage 1 notes, so the current choices stand and go into the pull request body. Later on 2026-09-25 a new session opened pull request #20 with those points under "For review", added Stage 2 on the same branch (the four workflows, Dependabot, AGENTS.md lines; see the Stage 2 notes), got CI green (run 36148707435, all 11 jobs), created the ruleset on `master` and squash-merged the pull request as 8f43080. Stages 0 (Mark's two browser tasks aside), 1 and 2 are done; Stage 3 waits for Mark to add the trusted publisher on npmjs.com. Nothing has been published to npm. Later on 2026-09-25 Mark added the trusted publisher and a third session pushed v3.0.0-beta.1: release run 36153096874 staged it under `next` (stage id f6123f79) and created the GitHub prerelease; it waits for Mark's approval. Update this section as stages land.

## Where it stands (inventory taken 2026-09-24)

| Area | State | Evidence |
|---|---|---|
| npm | 2.0.0, published 2022-11-29; 31 versions since 2016-05-06; about 25 downloads a week, 9,102 in the last year; maintainer `markrogers` | `npm view get-title-at-url`, api.npmjs.org downloads |
| Code | ESM (`"type": "module"`), three files: `index.js` (axios + article-title + is-url), `cli.js` (meow 11), `test.js` (ava 5, live calls to google.com and yahoo.com) | repo root |
| Works today? | Yes on Node 24.18: `node cli.js https://example.com/` prints `Example Domain`; the four live tests pass; `xo` is clean | baseline run 2026-09-24 |
| Rough edges | No argument: uncaught `Error: Invalid url` with a stack trace. 404: prints `error: AxiosError: Request failed with status code 404`. `error` is sometimes a string, sometimes an Error. The result leaks the whole axios response and body. The 404 branch in `requestResponseHandler` is dead (axios throws on non-2xx and `result.error` never exists). `test.js` passes a callback to a function that takes none and sets `global.Promise = Promise`. `tags` is not an npm field. No `engines`, `exports`, `types`, `sideEffects`, `funding`, `publishConfig` | `index.js`, `cli.js`, `test.js`, `package.json` |
| Runtime deps | axios ^1.1.3 (latest 1.20.0), article-title ^4.1.0 (latest 5.0.0, Node 20+, depends on cheerio 1.2.0: 11 deps, about 1 MB unpacked), is-url 1.2.4 (unchanged since 2023), meow ^11 (latest 14.1.0, Node 20+) | `npm view` 2026-09-24 |
| Dev deps | ava ^5.1 (latest 8.0.1, needs Node 22.20, 24.12 or 26), xo ^0.53 (latest 5.0.1, Node 22+, ESLint 10), execa ^6 (latest 10.0.1), nyc ^15 (latest 18), snyk, coveralls, codecov.io (all three are dead weight) | `npm view` 2026-09-24 |
| Lockfile | lockfileVersion 2, 1,534 resolved packages, 766 installed by `npm ci` with ten deprecation warnings (request, hawk, hoek, boom, sntp, cryptiles, uuid 3, node-uuid, har-validator) | `package-lock.json`, `npm ci` 2026-09-24 |
| Security alerts | 82 open Dependabot alerts (4 critical, 35 high, 38 medium, 5 low): 48 in dev scope (js-yaml, webpack, lodash, request, qs, json5, hoek, form-data, babel) and 34 in runtime scope (axios ranges, follow-redirects, form-data, semver). `npm audit --omit=dev` reports 4 (1 critical). Every one of them goes away with the new dependency set | `gh api .../dependabot/alerts`, `npm audit` |
| GitHub Actions | None (`total_count: 0`). Default workflow permissions are `write`; SHA pinning not required | `gh api .../actions/workflows`, `.../actions/permissions` |
| CI leftovers | `.travis.yml` (travis-ci.org is gone), `.snyk`, three live webhooks: notify.travis-ci.org (id 83047120) and two snyk.io hooks (ids 14564186, 278618458) | `gh api .../hooks` |
| Bot pull requests | 11 open: Snyk #11, #12, #13, #14, #15, #16, #17, #18, #19 (axios bumps and a semver/follow-redirects fix) and Dependabot #9 (json5), #10 (webpack). All touch only `package.json` and the lockfile | `gh pr list --state all` |
| Branches | `master` (default) plus 14 stale remote branches: 11 `snyk-fix-*`, 2 `dependabot/*`, and `develop` (0 commits ahead, 2 behind) | `git branch -a`, `git log master..origin/develop` |
| Releases | None. 26 tags from v1.0.1 to v2.0.0 | `gh release list`, `git tag` |
| Repo settings | Description still says "combines articleTitle with request". No topics, no homepage. Wiki and Projects on. Delete-branch-on-merge off. Secret scanning and push protection off. Private vulnerability reporting not enabled. No rulesets. Community profile 42 percent (no CONTRIBUTING, SECURITY, templates) | `gh repo view`, `gh api .../community/profile` |
| Issues | #6 "Many Warnings!" open since 2022-10-23: the reporter installed 1.1.8, whose runtime dependency `request` caused the warnings; 2.0.0 fixed it but the issue was never closed. #3 (Yahoo, CORS from a browser) closed | `gh issue list --state all`, `npm view get-title-at-url@1.1.8 dependencies` |
| README | Six badges, five dead (nodei.co, Travis, Coveralls, Snyk, Gitter). Usage text still describes "whatever error request passes back" | `README.md` |
| Local machine | Node 24.18.0, npm 11.16.0 (npm 12.1.0 is `latest`), `gh` logged in as m4bwav with `repo` and `workflow` scopes, npm not logged in, no Node version manager (fnm, nvm absent) | 2026-09-24 |

## Target state

| Area | v3 target |
|---|---|
| Source | TypeScript in `src/`: `index.ts` (fetch + extract), `extract-title.ts` (pure HTML to title), `errors.ts`, `cli.ts` |
| Build | `tsdown` emits dist/index.mjs (ESM), dist/index.cjs (CJS), dist/index.d.mts and dist/index.d.cts, dist/cli.mjs with its shebang. Fallback if tsdown misbehaves: two `tsc` passes |
| package.json | `exports` map with `types`, `import`, `require`; `main`, `module`, `types` for old resolvers; `bin`; `files: ["dist"]`; `engines.node: ">=20"`; `sideEffects: false`; no `publishConfig` (an unscoped package is public and provenance is automatic with trusted publishing); `funding` optional; expanded keywords; `tags` field removed |
| Runtime deps | None. The library uses `fetch`, `URL` and `TextDecoder`; the CLI uses `node:util` `parseArgs` |
| Tests | Nine layers, see the test strategy below: unit, functional against a local fixture server, CLI, package shape, consumer fixtures for every artifact, Bun and Deno, coverage with `c8` (the built-in reporter is still experimental), opt-in live smoke, post-publish verification from the registry |
| Lint and types | `xo` 5 (flat config) and `tsc --noEmit`; `publint` and `attw` (the arethetypeswrong CLI package) check the published shape |
| CI | `ci.yml`: lint, typecheck, build, test matrix Node 20/22/24/26 on `ubuntu-24.04` (pinned: `ubuntu-latest` moves to 26.04 between 2026-10-19 and 2026-11-19) plus Node 24 on `windows-latest` and `macos-latest`, Bun and Deno jobs, publint, attw, pack-and-install consumer fixtures. Actions pinned to commit SHAs, `permissions: contents: read` |
| Release | `release.yml` on tag `v*`: build, test, `npm stage publish` through trusted publishing (OIDC, no token anywhere, provenance automatic), a GitHub Release with the changelog section; Mark approves the staged version on npmjs.com with 2FA, then runs `verify-published.yml`. Prerelease tags go under the `next` dist-tag |
| Dependencies | `dependabot.yml`: npm weekly, grouped minor and patch; github-actions weekly |
| Repo hygiene | Dead branches, bot PRs and webhooks gone; Snyk uninstalled; secret scanning, push protection and private vulnerability reporting on; description, topics and homepage set; a light ruleset on `master` (no force push, no deletion, CI required on PRs) |
| Docs | README rewritten for ESM, CJS, TypeScript, Deno, Bun and browser users; `CHANGELOG.md` (Keep a Changelog); `SECURITY.md`; `AGENTS.md` + `CLAUDE.md` (`AGENTS.md import`) + .github/copilot-instructions.md; `ai-docs/` |

## Decisions (recommendation first; Mark can overrule any of them)

| # | Question | Recommendation | Why | Alternative |
|---|---|---|---|---|
| D1 | Node floor | `engines.node: ">=20"`, CI matrix 20, 22, 24, 26 | "As available as possible." Everything the core needs (`fetch`, `URL.canParse`, `AbortSignal.timeout`, `AbortSignal.any`, `node:test`) exists in Node 20. Node 20 reached end of life on 2026-04-30 (Node 22 is Maintenance LTS until 2027-04-30, Node 24 Active LTS until it enters maintenance on 2026-10-20, Node 26 becomes Active LTS on 2026-10-28), so 20 costs nothing to support but must never constrain the code; drop it in v4. The research note recommends `>=22` because the dev tools need 22; those run on Node 24 in CI and never bind consumers | `>=22` if any chosen dependency forces it |
| D2 | Title extraction | Own zero-dependency extractor: first `<title>` in the document, `og:title` and `twitter:title` as fallbacks, `og:site_name` used to strip a site-name suffix, split only on spaced separators (` | `, ` - `, ` – `, ` — `, ` · `, ` » `), numeric plus common named entity decoding, whitespace collapse | Removes cheerio (11 deps, about 1 MB) and article-title, which is the only way to a zero-dependency, browser-safe core. article-title's h1-over-title heuristic is dropped; the separator heuristic is kept but made safer (its `/^[^|\-/•—]+/` cuts "Node-API docs" to "Node") | Keep `article-title@5` and accept cheerio; or `htmlparser2` alone |
| D3 | HTTP client | Native `fetch` with `AbortSignal.timeout` (default 10 s), `Accept: text/html`, a `User-Agent` naming the package, redirects followed, a byte cap on the body (default 1 MiB; the title lives in `<head>`), charset from `Content-Type` or `<meta charset>` decoded with `TextDecoder` | Drops axios (source of all 34 runtime-scope alerts) and is-url. Same behaviour on Node, Bun, Deno, Workers | undici directly (Node-only) |
| D4 | Module format | Dual ESM + CommonJS from one TypeScript source | `require(esm)` only works on Node 20.19+ and 22.12+; dual output reaches every CJS consumer and every bundler. attw and publint guard the shape in CI | ESM-only with `engines` `^20.19.0 \|\| >=22.12.0`, which is what Node's publishing guide and most maintainers now recommend; see the build section for the trade-off |
| D5 | Language | TypeScript source, types emitted by the build | Mark asked for a TypeScript version; for 100 lines the cost is one build step and the payoff is real `.d.ts` files | JavaScript with JSDoc and `tsc --emitDeclarationOnly` |
| D6 | Test runner | `node:test` (`node --test`) | Runs on every Node in the matrix, including 20; ava 8 needs 22.20 or 24.12 and would break the Node 20 job. One fewer dependency | ava 8 with the matrix cut to 22+ |
| D7 | Linter | `xo` 5 (`xo.config.js`, an array of flat-config objects; it also lints `package.json`) | Continuity with the existing config and the sindresorhus tooling the package already uses (meow) | Biome 2.5 (faster, one binary, one `biome.json`) |
| D8 | API shape | Keep the `{title, error}` result and never throw; add `url` (final URL after redirects) and `status`; `error` is always a `GetTitleError` with a `code`; options object; named export `getTitleAtUrl` plus a default export; new named export `extractTitle(html)` | Existing callers keep working (`const {title} = await getTitleAtUrl(url)`); TypeScript callers get a discriminated union; CJS callers can `require()` without `.default` | Throw on failure and return a string |
| D9 | Version | 3.0.0 | Breaking: Node floor, `response` and `body` removed from the result, `error` type, extraction heuristic | 2.1.0 is not honest about the breaks |
| D10 | Default branch | Keep `master` | Matches Mark's other repos; renaming adds nothing to availability | Rename to `main` (GitHub does the redirects) |
| D11 | Release flow | `npm version <major|minor|patch>` locally, `git push --follow-tags`, the tag triggers `release.yml` | One command, no release bot, version and tag always agree | release-please or changesets |
| D16 | Publish mode | Staged publishing (`npm stage publish`), Mark approves on npmjs.com | Since 2026-09-03 a trusted-publisher config defaults to staging and GitHub recommends keeping it that way; the approval is one click with 2FA after npm's malware scan, and it is the review gate a solo maintainer otherwise lacks | Tick `npm publish` in the trusted-publisher config for a hands-off release |
| D12 | Coverage service | None; CI prints the summary and stores the lcov as an artifact | Coveralls and Codecov add tokens and dependencies for a 100-line package | Codecov with OIDC |
| D13 | Snyk | Remove entirely | Dependabot alerts, `npm audit` in CI and zero runtime deps cover it; Snyk produced eleven noise PRs | Keep the free tier |
| D14 | Lockfile | Keep `package-lock.json`, regenerated as lockfileVersion 3 | Dependabot and reproducible CI need it; consumers never see it | None |
| D15 | JSR | Optional Stage 5, not a blocker | Nice for Deno users; the npm package already works in Deno through `npm:` specifiers | Skip |

## Proposed public API (v3)

```ts
export interface GetTitleOptions {
  /** Milliseconds before the request is aborted. Default 10_000. */
  timeout?: number;
  /** Caller's abort signal; combined with the timeout. */
  signal?: AbortSignal;
  /** Extra request headers, merged over the defaults (User-Agent, Accept). */
  headers?: Record<string, string>;
  /** Injectable fetch (tests, custom dispatchers, Workers). Default: globalThis.fetch. */
  fetch?: typeof fetch;
  /** Stop reading the body after this many bytes. Default 1 MiB. */
  maxBytes?: number;
}

export type GetTitleErrorCode =
  | 'INVALID_URL'   // not an absolute http(s) URL
  | 'HTTP_ERROR'    // response status outside 200-299 (status is set)
  | 'NETWORK_ERROR' // DNS, TLS, connection reset, fetch threw
  | 'TIMEOUT'       // aborted by the timeout or the caller's signal
  | 'NOT_HTML'      // Content-Type is not text/html or application/xhtml+xml
  | 'NO_TITLE';     // the page has no usable title

export class GetTitleError extends Error {
  readonly code: GetTitleErrorCode;
  readonly status?: number;
  readonly url?: string;
  readonly cause?: unknown;
}

export type GetTitleResult =
  | { title: string; error?: undefined; url: string; status: number }
  | { title?: undefined; error: GetTitleError; url: string; status?: number };

/** Fetch a page and return its title. Never throws; failures come back as `error`. */
export function getTitleAtUrl(url: string | URL, options?: GetTitleOptions): Promise<GetTitleResult>;
export default getTitleAtUrl;

/** Pure function: HTML string in, cleaned title out (undefined when there is none). Works in any runtime. */
export function extractTitle(html: string, options?: { clean?: boolean }): string | undefined;
```

CLI (`get-title-at-url <url> [--timeout <ms>] [--json]`): prints the title on stdout and exits 0; prints `error: <message>` on stderr and exits 1; prints usage and exits 2 when no URL is given; `--help` and `--version` are handled by the CLI itself (`parseArgs` from `node:util`, D17).

Behaviour that changes from 2.0.0, to be listed in the changelog: the result no longer contains `response` and `body`; `error` is always a `GetTitleError` (2.0.0 returned the string `'Unexpected response'` or an AxiosError); an invalid URL no longer throws, it returns `error.code === 'INVALID_URL'`; a page whose `<h1>` differs from its `<title>` now returns the `<title>` (2.0.0 preferred the heading through article-title); Node 18 and older are out.

## Build and package specifics (what Stage 1 implements)

Every fact here was verified on 2026-09-24 and 2026-09-25 against the tools' own docs, and the tsdown config below was built in a throwaway project on this machine (Node 24.18, tsdown 0.23.0, TypeScript 7.0.2) and passed `publint` ("All good!") and attw ("No problems found" in all four resolution modes). Details and sources: the packaging research note linked at the top.

### Output files

tsdown with `fixedExtension: true` names the files by format, so the artifacts are dist/index.mjs (ESM), dist/index.cjs (CommonJS), dist/index.d.mts, dist/index.d.cts, dist/cli.mjs (the bin), plus their `.map` files. Types resolve by sibling name (`index.cjs` finds `index.d.cts`), which is why no nested `types` conditions are needed.

### package.json shape

`exports: true` on the library entry makes tsdown write `main`, `module`, `types` and `exports` on every build; the hand-written fields are the rest.

```json
{
  "name": "get-title-at-url",
  "version": "2.0.0",
  "description": "Get the title of the web page at a URL. Zero dependencies, TypeScript, ESM and CommonJS, Node 20+.",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.cts",
  "exports": {
    ".": { "import": "./dist/index.mjs", "require": "./dist/index.cjs" },
    "./package.json": "./package.json"
  },
  "bin": { "get-title-at-url": "./dist/cli.mjs" },
  "files": ["dist"],
  "engines": { "node": ">=20" },
  "sideEffects": false,
  "license": "MIT",
  "repository": { "type": "git", "url": "git+https://github.com/m4bwav/get-title-at-url.git" },
  "homepage": "https://github.com/m4bwav/get-title-at-url#readme",
  "bugs": { "url": "https://github.com/m4bwav/get-title-at-url/issues" },
  "keywords": ["title", "page-title", "html", "url", "fetch", "og:title", "metadata", "scraper", "cli", "typescript", "esm", "cjs"],
  "dependencies": {},
  "devDependencies": { "tsdown": "0.23.0", "typescript": "~6.0", "c8": "^12", "xo": "^5", "publint": "^0.3", "attw (arethetypeswrong scope, cli package)": "^0.18", "the Node types package": "^24" }
}
```

Notes: the shape above is the one attw and publint approved; if the exports are ever written by hand instead, the equally approved form is `{"import": {"types": "./dist/index.d.mts", "default": "./dist/index.mjs"}, "require": {"types": "./dist/index.d.cts", "default": "./dist/index.cjs"}}` with `types` first and `default` last. Do not put `exports: true` on the CLI entry: it adds a `./cli` subpath that attw rejects (no types, ESM only); the CLI is reachable through `bin` only. `engines` stays `>=20` (D1); tsdown reads its `target` from it. Run `npm pkg fix` once after editing. The attw devDependency is really the scoped package (`arethetypeswrong` scope, `cli`) and the Node types package is the `types` scope, `node`; both are written without the scope here because the doc lint reads scopes as handles.

### tsconfig.json

- Extend two bases, stacked: the tsconfig node20 base (lib es2023, module and moduleResolution nodenext, target es2022, types [node], strict, esModuleInterop, skipLibCheck) and the tsconfig node-ts base (`rewriteRelativeImportExtensions`, `erasableSyntaxOnly`, `verbatimModuleSyntax`). Add `isolatedModules: true` and `noEmit: true` (tsdown emits) and `declaration: true` (tsdown's dts pass reads it).
- Source files import each other with `.ts` specifiers (./extract-title.ts); `rewriteRelativeImportExtensions` turns them into `.js` in emit, and Node's type stripping, Deno and JSR all want the `.ts` form. xo 5 enforces `.js`-for-`.ts` import extensions by default, so that one rule is switched off in `xo.config.js`.
- TypeScript: 6.0.x. TypeScript 7.0.2 (the Go compiler, GA 2026-07-08) builds the package with tsdown but tsdown warns that 7.0 "does not yet have a stable API"; xo 5 declares `typescript ^6.0.3`. Move to 7 when tsdown and xo both declare it.
- Node type stripping (development convenience only; shipped tests import `dist/`): on by default since Node 22.18 and 23.6, stable since 24.12 and 25.2, absent in 20. `node --test` picks up `*.test.ts` files by itself on 22.18+ and 24+, so a `.ts` test can be run directly while developing on Node 24; the committed suites stay `.js` so the Node 20 matrix job runs them against the built output.

### tsdown.config.ts (verified)

```ts
import {defineConfig} from 'tsdown';

export default defineConfig([
  {entry: {index: 'src/index.ts'}, format: ['esm', 'cjs'], platform: 'neutral', dts: true, fixedExtension: true, exports: true, sourcemap: true},
  {entry: {cli: 'src/cli.ts'}, format: 'esm', platform: 'node', dts: false, fixedExtension: true, sourcemap: true},
]);
```

- The shebang in src/cli.ts comes through verbatim as line 1 of dist/cli.mjs, and tsdown sets the execute bit. `platform: 'neutral'` makes the library resolve only through `exports` and assume no runtime; the CJS build is always platform node by design, which is fine.
- tsdown prints "We recommend using the ESM format instead of CommonJS" on every build that requests cjs. Expected; D4 chooses dual on purpose.
- tsdown can also run `publint: true` and `attw: true` after each build; the plan keeps them in the `check` script and in CI instead so the failures are visible as their own step.
- tsdown 0.23.0 is pinned exactly (pre-1.0; 3.4 million downloads a week against tsup's 6.2 million, but tsup's README says it is no longer maintained and points at tsdown). tsdown's own engines (`^22.18 || ^24.11 || >=26`) bind the developer, not consumers.
- Fallback without a bundler: two `tsc` runs and renames to `.cjs`/`.d.cts`; the TypeScript handbook itself warns that dual emit with one type check leaves one output unchecked, so only reach for it if tsdown breaks twice.

### Source layout and the details that matter

- src/extract-title.ts: pure function, no imports. Order: first `<title>` element that is not inside `<svg>` or a comment; else `og:title`; else `twitter:title` (article-title reads neither meta tag). Then decode entities (numeric decimal and hex, plus a table of about forty named entities: `amp`, `lt`, `gt`, `quot`, `apos`, `nbsp`, `copy`, `reg`, `trade`, `hellip`, `ndash`, `mdash`, `lsquo`, `rsquo`, `ldquo`, `rdquo`, `laquo`, `raquo`, `bull`, `middot`, `eacute` and the other common accented letters; the zero-dependency `entities` package, 330 KB, is the fallback if real pages need more), collapse whitespace, and strip a site-name suffix: if `og:site_name` is present and the title ends with a spaced separator followed by that name (case-insensitive), drop it; otherwise, if the title splits into two or more parts on a spaced separator (` | `, ` - `, ` – `, ` — `, ` · `, ` » `, ` :: `), keep the first part unless it is shorter than four characters. Never split on an unspaced hyphen.
- src/index.ts: `getTitleAtUrl` validates with `URL` (absolute, `http:` or `https:` only), builds the signal with `AbortSignal.any([options.signal, AbortSignal.timeout(timeout)])`, calls `fetch` with `Accept: text/html,application/xhtml+xml;q=0.9,*/*;q=0.1` and `User-Agent: get-title-at-url/<version> (+https://github.com/m4bwav/get-title-at-url)`, checks `response.ok` and the `Content-Type`, reads the body through `response.body.getReader()` until `maxBytes` (falls back to `arrayBuffer()` when there is no stream), sniffs the charset from the header, then from a `<meta charset>` or `http-equiv` tag in the first 1024 bytes (the HTML pre-scan rule), decodes with `new TextDecoder(label)` inside a try/catch that falls back to `utf-8` (Bun below 1.2.21 throws on legacy labels; Node's official builds, browsers, Deno and Workers accept them), and calls `extractTitle`. Error mapping: `TypeError` from `fetch` is `NETWORK_ERROR`; an `AbortError` or `TimeoutError` is `TIMEOUT`; a non-2xx status is `HTTP_ERROR` with `status`; a wrong content type is `NOT_HTML`; an empty result is `NO_TITLE`. The `url` in the result is `response.url` (after redirects) or the input when the request never completed.
- Portability rule, enforced by a test: src/index.ts and src/extract-title.ts never reference `process`, `Buffer`, `require`, `__dirname` or a `node:` module. Byte handling uses `Uint8Array`; text uses `TextDecoder`. Runtime facts behind it: `fetch` stable in Node 21 (unflagged since 18), `AbortSignal.timeout` since 17.3, `URL.canParse` since 18.17 and 19.9; browsers have `AbortSignal.timeout` from Chrome 103, Firefox 100, Safari 16 and `URL.canParse` from Chrome 120, Firefox 115, Safari 17; Cloudflare Workers need a compatibility date of 2022-10-31 or later for `URL.canParse`.
- src/cli.ts: `#!/usr/bin/env node`; `parseArgs` from `node:util` (stable since Node 20) with `timeout`, `json`, `help`, `version` options and one positional; the version string is read from `package.json` through `createRequire(import.meta.url)` (a relative require inside the package bypasses the `exports` map); help text is a constant in the file; exit codes as in the API section; errors go to stderr. The CLI bundle inlines the library, so dist/cli.mjs is one self-contained file.

### Why dual output still matters in 2026

`require()` of an ES module works unflagged from Node 22.12 and 20.19 (and every 23+); on 18, 20.0 to 20.18 and 22.0 to 22.11 it throws `ERR_REQUIRE_ESM`. Node's own publishing guide, Sindre Sorhus, Anthony Fu and Joyee Cheung all now recommend ESM-only with `engines` `^20.19.0 || >=22.12.0`; that is the ecosystem consensus and the alternative in D4. The plan ships both formats anyway because the brief is maximum reach: the cost is five config lines, one extra artifact in the test matrix and the dual-package hazard (two module instances if both formats load, harmless for a stateless fetcher); the gain is every CommonJS consumer on any Node 20 or 22 minor, older bundler and Jest setups, and a clean attw node10 column.

### Optional: JSR (Stage 5, not on the critical path)

JSR takes the TypeScript source directly (no build) and has about 22,000 packages. Requirements, all verified: a scoped name under Mark's JSR scope, a `jsr.json` with `name`, `version` and `exports` pointing at src/index.ts, ESM only, explicit return types on everything exported (the "no slow types" rule, which the source will satisfy anyway), `.ts` import specifiers (already the case), and publishing from `release.yml` with `npx jsr publish` under `id-token` set to `write` after linking the GitHub repository in the package settings on jsr.io. Node and Bun users then get it with `npx jsr add`; JSR ignores `bin`, so the CLI stays npm-only.

### Decision added while writing this section

| # | Question | Recommendation | Why | Alternative |
|---|---|---|---|---|
| D17 | CLI argument parsing | `parseArgs` from `node:util`; drop `meow` | The package then has no runtime dependencies at all: `npm install get-title-at-url` adds one package and prints nothing, which is the cleanest possible answer to issue #6; the CLI needs four flags and one positional, which `parseArgs` handles in a dozen lines | Keep `meow` 14 (zero dependencies of its own, nicer help rendering) |

## Stage 0: housekeeping and baseline (2026-09-24 to 2026-09-26, no code changes)

- [x] 2026-09-24: cloned to `D:\m4bwa\Claude\Projects\Ai\get-title-at-url`; everlast doc set registered (mode repo, sync push); baseline recorded above; research notes and this plan written.
- [x] Mark: read the decisions table; say which recommendations to change. Silence means the recommendations stand. (2026-09-25: read; every recommendation kept.)
- [x] Agent: close the 11 bot PRs with one comment each ("Superseded by the v3 rewrite, which drops axios and the dev tools these updates target") and delete their branches; delete `develop`. Commands in the appendix. (2026-09-25: done; each comment also names its advisory. The inventory's 14 branches included two left by PRs #4 and #5, closed unmerged in 2022, which the appendix loop could not reach; deleted too, so only `master` remains. Evidence in the log.)
- [x] Agent: delete the three webhooks (Travis id 83047120, Snyk ids 14564186 and 278618458). Commands in the appendix. (2026-09-25: done, the hooks API returns 0.)
- [ ] Mark: uninstall Snyk from GitHub (github.com/settings/installations, then remove the project at app.snyk.io) so it stops opening PRs. The `gh` token cannot list app installations (verified: HTTP 403), so this is a browser task. (2026-09-25: Mark revoked Snyk under Authorized OAuth Apps; whether a Snyk GitHub App is still listed under Installations, and the project at app.snyk.io, are unconfirmed.)
- [x] Agent (2026-09-25, read back and logged): repo settings through `gh`: description "Get the title of the web page at a URL. Zero dependencies, TypeScript, ESM and CommonJS, Node 20+.", homepage `https://www.npmjs.com/package/get-title-at-url`, topics (`title`, `html`, `url`, `fetch`, `scraper`, `cli`, `typescript`, `nodejs`), wiki and projects off, delete-branch-on-merge on, secret scanning and push protection on, private vulnerability reporting on, Actions default workflow permissions read-only. Commands in the appendix.
- [ ] Mark: confirm the npm account has two-factor authentication on (npmjs.com, Account, Two-Factor Authentication). Trusted publishing itself is configured in Stage 3, after the workflow file exists.

## Stage 1: rewrite on branch `v3` (2026-09-26 to 2026-10-03)

- [x] Branch `v3` from `master`. Remove `.travis.yml`, `.snyk`, `index.js`, `cli.js`, `test.js`, `package-lock.json`. (2026-09-25, commit f97a2b3.)
- [x] `package.json` as in the target table. Keep `"version": "2.0.0"` until the release step bumps it. Scripts: `build` (tsdown), `test` (build, then `node --test`), `test:live`, `lint` (xo), `typecheck` (tsc --noEmit), `check` (publint, attw, `npm pack --dry-run`), `prepack` (build), `prepublishOnly` (lint, typecheck, check, test). (Also `test:consumers` and `coverage`, see the notes below.)
- [x] `tsconfig.json` on a the tsconfig node20 base package base with `module` and `moduleResolution` `nodenext`, `verbatimModuleSyntax`, `strict`, `declaration` off (tsdown emits types). `tsdown.config.ts` with two entries, `format: ['esm', 'cjs']`, `dts: true`, the CLI entry marked so its shebang survives. (Built as the tsconfig section specifies: both bases stacked, `noEmit` and `declaration: true`.)
- [x] src/extract-title.ts per D2, with the entity table and the separator rules as named constants and a comment citing article-title (MIT, sindresorhus) for the heuristic's origin.
- [x] src/index.ts per D3 and D8. src/errors.ts for `GetTitleError`. src/cli.ts with `parseArgs` per the API section and D17.
- [x] `test/` per the test strategy below: layers 1 to 5 and 8 land in this stage (unit, functional, CLI, package shape, consumer fixtures, live smoke); layers 6, 7 and 9 are wired in Stage 2. (Commit 8fb3f68; the `coverage` script for layer 7 exists and reports 100 percent, its CI wiring is Stage 2.)
- [x] `xo` config, `.editorconfig`, `.gitattributes` (`* text=auto eol=lf`), `.gitignore` (`dist`, `coverage`, `node_modules`), No `.npmrc` with `ignore-scripts=true`: it would also skip this package's own `prepack`. The supply-chain guards are the lockfile, Dependabot's cooldown (3 days by default since 2026-07-14) and npm 12's default block on dependency install scripts (npm 12.1.0 is `latest`; this machine has 11.16.0, upgrade when convenient).
- [x] README rewrite: three live badges at most (npm version, CI, npm downloads), install, usage for ESM, CommonJS, TypeScript, Deno (`npm:get-title-at-url`), Bun, and the browser caveat (CORS; `extractTitle` works everywhere), API reference, error codes, CLI, migration from 2.x, license. (Commit 622198b; the CI badge shows a status once Stage 2 adds the workflow.)
- [x] `CHANGELOG.md` (Keep a Changelog format) with the 3.0.0 section and a compressed history of 1.x and 2.0.0 taken from the tags.
- [x] `SECURITY.md` pointing at GitHub private vulnerability reporting.
- [x] Local verification on Node 24: `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`, `npm run check`, `npm pack --dry-run` lists `dist/*`, `README.md`, `LICENSE`, `CHANGELOG.md`, `package.json` and nothing else. Record the output in the log. (2026-09-25, all green, also on Node 20 and 22 and from a fresh clone; the pack lists everything in dist except dist/cli.mjs.map.)
- [x] Open the pull request `v3` into `master` so Stage 2's CI runs on it; squash-merge when green. Waits for Mark's review of the diff and the test output. (2026-09-25: Mark said to push everything and continue in a new session. Pull request #20 opened with the two open points under "For review", which Mark has not ruled on, so the current choices stand; CI green in run 36148707435; squash-merged as 8f43080.)

### Stage 1 notes (2026-09-25): findings and where the build departs from the plan

Evidence is in the log. The traps behind these are in [../notes/2026-09-25-v3-build-and-test-traps-tsdown-0-23-xo-5-npm-11-node-test.md](../notes/2026-09-25-v3-build-and-test-traps-tsdown-0-23-xo-5-npm-11-node-test.md).

- Tarball budget 50 kB, not 40. With the docs and the encoding code the tarball is 40.1 kB; the two library source maps, which carry the TypeScript source, are most of it. Maps without their sources would make Vite warn consumers, so the choice is between this budget and not publishing maps at all (about 17 kB). For Mark to confirm.
- dist/cli.mjs.map is built (coverage of the CLI needs it) but kept out of the tarball: `files` is `["dist", "!dist/cli.mjs.map", "CHANGELOG.md"]`. The CLI bundles the library, so its map repeats the library's. npm 11 packs CHANGELOG.md only when `files` names it.
- `require('get-title-at-url')` returns an object whose `getTitleAtUrl` and `default` are the same function, as layer 5 says; the verification checklist below expected a callable export and now expects `object function`.
- og:site_name is stripped as a prefix too ("GitHub - owner/repo: text" gives "owner/repo: text"); the plan named only the suffix, and GitHub pages would otherwise come back as "GitHub", as they did in 2.0.0.
- Node 20's TextDecoder decodes windows-1252, latin1, iso-8859-1 and us-ascii bytes 0x80 to 0x9F as C1 controls, so the package decodes that family itself: [../solutions/2026-09-25-node-20-textdecoder-decodes-windows-1252-bytes-0x80-0x9f-as-.md](../solutions/2026-09-25-node-20-textdecoder-decodes-windows-1252-bytes-0x80-0x9f-as-.md). Node 22 and 24 are correct.
- `AbortSignal.any` is used where the runtime has it; a forwarding controller covers Node 20.0 to 20.2 and browsers without it. `new URL` in a try/catch replaces `URL.canParse`, which is newer in browsers.
- The two tsconfig base packages are devDependencies (the package.json shape above did not list them). The version for the User-Agent comes from a build-time `define`, so the library never reads package.json.
- Test scripts name their files (plain `node --test` would run the helpers and fixtures under test/). Layer 7's `coverage` script needs `--exclude-after-remap`: [../solutions/2026-09-25-c8-reports-0-for-src-when-include-filters-before-source-maps.md](../solutions/2026-09-25-c8-reports-0-for-src-when-include-filters-before-source-maps.md).
- xo 5: every rule turned off is listed with its reason in `xo.config.js` (the package.json shape attw and publint approved, the deliberate version pins, the `u` rather than `v` regex flag for older browsers, table-driven tests).
- Bun and Deno are not installed here; layer 6 runs them in CI (Stage 2).

## Stage 2: GitHub setup (in the same pull request, 2026-09-26 to 2026-10-03)

- [x] `.github/workflows/ci.yml` per the target table (2026-09-25, 160e9fe and 63c1691; see the Stage 2 notes). Triggers: push to `master`, pull requests, manual. `concurrency` cancels superseded runs. Actions and their current majors: `actions/checkout` v7.0.1, `actions/setup-node` v7.0.0, `actions/upload-artifact` v7.0.1, `oven-sh/setup-bun` v2.2.0, `denoland/setup-deno` v2.0.5 (all checked 2026-09-24). Every one pinned to a commit SHA with the version in a comment; Dependabot updates both. Nothing older: runners removed the Node 20 action runtime on 2026-09-23.
- [x] `.github/workflows/release.yml` per the target table (2026-09-25, 160e9fe; two jobs, see the Stage 2 notes; first real run is the Stage 3 rehearsal). Trigger: tag `v*`. `permissions` with `id-token` set to `write` and `contents` set to `write`. Node 24 (its npm 11.19 satisfies the 11.5.1 floor for trusted publishing and the 11.15 floor for `npm stage publish`; Node 22 ships npm 10.9.9, which cannot do either). Guard step: the tag must equal `package.json` `version`. No `--provenance` flag and no token: both are automatic with OIDC. `repository.url` must match the GitHub repository exactly; the current `https://github.com/m4bwav/get-title-at-url.git` does. Prerelease versions (`-beta.N`) are staged with `--tag next`, releases with `latest`. Then `gh release create --verify-tag` with the matching changelog section (prereleases marked as such).
- [x] `.github/workflows/verify-published.yml` (manual, version input) and `.github/workflows/live.yml` (weekly schedule and manual) per the test strategy. (2026-09-25, 160e9fe; verify-published first runs after the rehearsal's approval.)
- [x] `.github/dependabot.yml`: npm weekly (Monday), groups `minor-and-patch`; github-actions weekly. (2026-09-25, 160e9fe; both on Monday.)
- [x] `AGENTS.md` (what it is, rules, commands, the everlast block), `CLAUDE.md` (its first line imports AGENTS.md), `.github/copilot-instructions.md` (one-line pointer). Use the evergreen templates at `D:\m4bwa\Claude\Projects\Ai\evergreen\templates\`. (2026-09-25: checked against this list, not rewritten; AGENTS.md gained the new commands and two traps, see the Stage 2 notes.)
- [x] Ruleset on `master`: block force pushes and deletion; require the `ci` status checks for pull requests; repository admin on the bypass list so a direct push by Mark still works. (2026-09-25: ruleset 24003504 "master", active on the default branch: deletion, non_fast_forward, required check `ci` from GitHub Actions (app 15368), bypass RepositoryRole 5 (admin) always; the API reports current_user_can_bypass "always" for m4bwav.)
- [x] Verify: CI green on the PR (record the run id), attw and publint clean, the pack-and-install smoke job imports and requires the tarball on Node 20 and 24. (2026-09-25: run 36148707435 on a173016, all 11 jobs green: publint "All good!", attw green in node10, node16 from CJS and from ESM, and bundler, tarball 40.1 kB with 11 files, coverage 100 percent, the consumer fixtures on Node 20.20.2, 22, 24.20.0 and 26.10.0 on Linux and on Windows and macOS, Bun 1.4.2 and Deno 2.9.7.)

### Stage 2 notes (2026-09-25): how the workflows carry out the plan

Evidence is in the log.

- Every CI job installs and builds on Node 24, then switches to its own Node line and runs `npm run test:dist` (a new script: the main suites against the dist/ already built) and the consumer fixtures, because tsdown cannot run on Node 20. The consumer test no longer builds by itself; `npm run test:consumers` builds first.
- Layer 6 runs through the consumer test: `CONSUMER_RUNTIMES=bun` or `deno` adds tests that run the esm-node fixture, the cjs-node fixture (Bun only) and the bin under that runtime, from the same packed tarball and against the same fixture server. Deno uses `--node-modules-dir=manual`, the flag the test strategy asked to verify (Deno's docs, 2026-09-25); `bunx --bun --no-install` runs the bin on Bun and never downloads.
- Layer 9 reuses that test with `CONSUMER_PACKAGE=get-title-at-url@<version>`, which installs the version from npm instead of packing. `release.yml` does not call `verify-published.yml`, as layer 9 first said: a staged version is not on the registry until Mark approves it, so the workflow is run by hand after the approval, as the target table and Stage 3 already say, and it waits up to 10 minutes for the registry to serve the version. npx, bunx and deno run the published CLI from an empty directory, because inside the checkout npx could take the repository itself for the package.
- The ruleset requires one check, the final `ci` job, which passes only when every other job in `ci.yml` passed; changing the matrix never needs a ruleset change.
- `release.yml` has two jobs. `build`, read-only, checks the tag against `package.json` and the changelog (a release's heading must carry its date; a prerelease takes the section of the release it leads to), runs lint, typecheck, the tests, `check` and the consumer fixtures, and packs the tarball. `publish`, the only job with `id-token` and `contents` set to write, runs no dependency code: it checks that npm is 11.15 or later, stages that tarball with `npm stage publish <tarball> --tag <next|latest>` and creates the GitHub Release. Verified in the npm 11.19 source: lifecycle scripts run only when publishing a directory; staging shares the publish command's OIDC exchange and automatic provenance; a prerelease without `--tag` is refused, so a beta cannot become `latest` by accident. setup-node's `registry-url` and `package-manager-cache: false` follow the npm docs' example (2026-09-03); npm's OIDC step replaces the placeholder token setup-node configures.
- actions/download-artifact v8.0.1 (commit 3e5f45b, node24) joins the action list, for `release.yml`.
- AGENTS.md, CLAUDE.md and the Copilot pointer, checked against this plan: AGENTS.md has what it is, the rules, the commands and the everlast block; CLAUDE.md imports it on line 1; the Copilot file is a one-sentence pointer under a heading. The evergreen templates' Evergreen block does not apply (this repository has no evergreen units). AGENTS.md gained the `test:dist` command, the consumer test's two variables and two traps (CI builds on Node 24; the trusted publisher names `release.yml`).
- Finding: every fresh install of 2.0.0 has thrown on import since 2024-08-09 (article-title 4 imports cheerio's default export, which cheerio 1.0.0 removed), so 3.0.0 also replaces a published version that no longer loads.

## Stage 3: publish 3.0.0 (2026-10-03 to 2026-10-10)

- [x] Mark (one-time, browser): on npmjs.com open the package, Settings, Trusted publishing, add a GitHub Actions publisher: Organization or user `m4bwav`, Repository `get-title-at-url`, Workflow filename `release.yml`, Environment name blank, Allowed actions `npm stage publish` (the default; tick `npm publish` only if D16 is overruled). Entries cannot be edited, only deleted and recreated. Once it works, set the package to "Require two-factor authentication and disallow tokens". No token is stored anywhere. (2026-09-25: added by Mark with these fields. The form as it is today: `npm stage publish` is always allowed and the only box is "Allow npm publish", left unticked; an optional Label; a warning that the provider and required fields cannot be changed later. Publishing access was already on "Require two-factor authentication and disallow bypass 2fa tokens (recommended)", which the page says works with trusted publishers, so that setting needs no later step. It works: release run 36153096874 staged 3.0.0-beta.1 through OIDC with no token.)
- [ ] Agent: rehearsal. `npm version 3.0.0-beta.1` on `master`, `git push --follow-tags`; the workflow stages the version under `next`; Mark approves it on npmjs.com. Verify with `npm view get-title-at-url@next version`, `npm view get-title-at-url dist-tags` (`latest` must still be `2.0.0`), `npx -y get-title-at-url@next https://example.com/` on this machine, and `npm audit signatures` in a temp project. This is also where to confirm that staged publishing honours `--tag next` (unverified in the research; if it does not, a prerelease without the tag would become `latest`, so publish prereleases directly or skip the rehearsal and rely on the CI consumer fixtures). Fix and repeat with `beta.2` if anything fails. (2026-09-25: `npm version 3.0.0-beta.1` committed e26bf22 and tag v3.0.0-beta.1; release run 36153096874 green: build job 186 of 186 tests, publint and attw clean, consumers 7 pass and 5 skipped, tarball 40.2 kB with 11 files; `npm stage publish` staged it "with tag next", stage id f6123f79-4603-46ce-91b8-23d82362cb18, provenance signed (sigstore log index 2957911315); GitHub prerelease v3.0.0-beta.1 created; `latest` still 2.0.0. Waiting for Mark to approve on npmjs.com, Staged Packages tab.)
- [ ] Agent: set the changelog date, `npm version 3.0.0`, `git push --follow-tags`, watch the run; Mark approves the staged 3.0.0 on npmjs.com; agent runs `verify-published.yml` with `3.0.0`. Verify: `npm view get-title-at-url version` prints `3.0.0`; `npx -y get-title-at-url@3 https://example.com/` prints `Example Domain`; a fresh temp project can `import` and `require` it on Node 20, 22 and 24 (the CI smoke job repeats this against the registry); the GitHub Release for `v3.0.0` exists with notes; the npm page shows provenance.
- [ ] Agent: close issue #6 with a note that 3.0.0 has no runtime dependencies and the warnings came from the old dev tools. Update the README badges if any URL changed.
- [ ] Agent: log the release, rewrite `ai-docs/HANDOFF.md`, and record the trusted-publishing steps as a solution entry once they are verified.

## Stage 4: keep it healthy (from 2026-10-10)

- [ ] Merge Dependabot PRs when CI is green; read release notes for majors.
- [ ] Node 26 becomes Active LTS on 2026-10-28 and is already in the matrix. Node 22 reaches end of life on 2027-04-30: plan v4 then with `engines.node: ">=24"` (Node 24 is supported until 2028-04-30).
- [ ] Optional Stage 5: publish to JSR from the same source (`jsr.json`, `npx jsr publish` with OIDC in `release.yml`); a small "title of a URL" tool page on markdavidrogers.com using the same package (the site plan's Stage 3 tools area).

## Verification checklist (what "done" means)

| Claim | Command or place | Expected |
|---|---|---|
| Installs clean | `npm ci` on a fresh clone | No deprecation warnings, no audit findings |
| Zero runtime deps | `npm ls --omit=dev --all` | Nothing under the package |
| Dual output is correct | `npx publint` and `npx attw --pack .` | No errors, no "masquerading" problems |
| Types work | test/types.test-d.ts compiles; an editor shows `GetTitleResult` | Union narrows on `error` |
| CJS works | `node -e "const g=require('get-title-at-url'); console.log(typeof g, typeof g.getTitleAtUrl)"` | `object function` (corrected 2026-09-25: `require()` returns the exports object, as layer 5 specifies) |
| ESM works | `node --input-type=module -e "import g from 'get-title-at-url'; console.log(typeof g)"` | `function` |
| Every Node line | CI matrix 20, 22, 24, 26 | All green |
| Other runtimes | `bunx get-title-at-url https://example.com/` and `deno run -A npm:get-title-at-url https://example.com/` (manual, once) | `Example Domain` |
| Published with provenance | npm package page, "Provenance" section; `npm view get-title-at-url dist.attestations`; `npm audit signatures` in a project that installed it | Present, and signatures verified |
| Release exists | `gh release view v3.0.0` | Notes from the changelog |
| No alerts | `gh api repos/m4bwav/get-title-at-url/dependabot/alerts?state=open --jq length` | `0` |
| Repo tidy | `gh pr list`, `git branch -r`, `gh api .../hooks` | 0 bot PRs, only `master`, 0 webhooks |

## Risks and open points

- tsdown is pre-1.0 (0.23.0 on 2026-09-03). Pin it exactly in devDependencies; if a Dependabot bump breaks the build, the fallback is two `tsc` passes (ESM, then CJS with a `package.json` `{"type": "commonjs"}` in `dist/cjs`).
- TypeScript 7.0 (the native compiler) reached npm on 2026-09-24. Start on the TypeScript version tsdown and xo declare support for; upgrade when both do.
- The extraction heuristic changes results on pages where article-title picked an `<h1>`. The fixtures record the new behaviour; the changelog says so.
- Trusted publishing requires the workflow filename entered on npmjs.com to match exactly, and a config entry cannot be edited (delete and recreate); a renamed workflow silently breaks publishing. The rehearsal (beta.1) catches this before 3.0.0.
- Staged publishing and `--tag next`: npm refuses to stage a prerelease without `--tag` (npm 11.19 source, 2026-09-25), so a beta cannot become `latest` at staging; whether the approval keeps the staged tag is still the rehearsal's question.
- npm 12 blocks dependency install scripts by default and Dependabot waits 3 days before proposing a new version; both are wanted, neither affects this package's own scripts.
- Node 26 may not be Active LTS yet on the release day; the matrix runs it anyway and the `engines` range (`>=20`) already includes it.
- Windows development: `.gitattributes` keeps LF in the repo and git normalises on commit. On 2026-09-25 the Write and Edit tools wrote LF, checked by counting byte 13; the earlier belief that the Write tool writes CRLF may come from a grep check, which cannot see carriage returns in Git Bash (user tier solution of 2026-09-25). Check line endings by byte count after batch writes.
- Browser callers cannot fetch arbitrary sites (CORS). The README states it and points them at `extractTitle` with their own proxy.

## Appendix: Stage 0 commands (run from any directory; all paths absolute)

```bash
# Close the bot pull requests and delete their branches
for n in 9 10 11 12 13 14 15 16 17 18 19; do
  gh pr close "$n" -R m4bwav/get-title-at-url --delete-branch \
    --comment "Superseded by the v3 rewrite, which drops axios and the dev tools these updates target."
done
gh api -X DELETE repos/m4bwav/get-title-at-url/git/refs/heads/develop

# Remove the dead webhooks (Travis, Snyk, Snyk)
for id in 83047120 14564186 278618458; do
  gh api -X DELETE "repos/m4bwav/get-title-at-url/hooks/$id"
done

# Repository settings
gh repo edit m4bwav/get-title-at-url \
  --description "Get the title of the web page at a URL. Zero dependencies, TypeScript, ESM and CommonJS, Node 20+." \
  --homepage "https://www.npmjs.com/package/get-title-at-url" \
  --enable-wiki=false --enable-projects=false --delete-branch-on-merge \
  --add-topic title --add-topic html --add-topic url --add-topic fetch \
  --add-topic scraper --add-topic cli --add-topic typescript --add-topic nodejs
gh api -X PATCH repos/m4bwav/get-title-at-url \
  -f 'security_and_analysis[secret_scanning][status]=enabled' \
  -f 'security_and_analysis[secret_scanning_push_protection][status]=enabled'
gh api -X PUT repos/m4bwav/get-title-at-url/private-vulnerability-reporting
gh api -X PUT repos/m4bwav/get-title-at-url/actions/permissions/workflow \
  -f default_workflow_permissions=read -F can_approve_pull_request_reviews=false
```

## Test strategy: every artifact in every environment, and the behaviour itself

The build emits six things: dist/index.mjs (ESM), dist/index.cjs (CommonJS), dist/index.d.mts, dist/index.d.cts, dist/cli.mjs (the `bin`), and the tarball `npm pack` produces. Each one is exercised where a consumer would use it, before publishing (from the packed tarball) and after publishing (from the registry). Functional behaviour is tested against a local fixture server, never the live internet, except for one opt-in smoke suite.

### Layers

| Layer | What it proves | How | Runs where |
|---|---|---|---|
| 1. Unit (`extractTitle`) | The HTML heuristics | `node:test` cases on inline HTML: plain title; uppercase `<TITLE>`; attributes on the tag; newlines and runs of spaces inside the title; named, decimal and hex entities (`&amp;`, `&#39;`, `&#x27;`, `&eacute;`, `&#8217;`, `&nbsp;`); a `<title>` inside an inline `<svg>` in the body is ignored in favour of the head's; `<title>` inside an HTML comment is ignored; `og:title` and `twitter:title` fallbacks when `<title>` is missing or empty; `og:site_name` suffix stripped (`Post | Site` becomes `Post`); two segments without a site name keep the first; hyphenated words are not split (`Node-API docs` stays whole); an empty document returns `undefined`; `{clean: false}` returns the decoded raw title | Every CI job, both builds |
| 2. Functional (`getTitleAtUrl`) | The fetcher end to end | `node:http` fixture server on `127.0.0.1:0` with one route per case: 200 HTML; 200 with `charset=iso-8859-1` and with `gbk` bytes (decoded through `TextDecoder`, guarded if the runtime lacks the encoding); 204 empty body (`NO_TITLE`); `application/json` body that contains `<title>` (`NOT_HTML`); 301 then 302 then 200 (`url` is the final URL); relative `Location`; redirect loop (`NETWORK_ERROR`); 404 and 500 (`HTTP_ERROR` with `status`); a handler that sleeps past `timeout` (`TIMEOUT`); the caller's `signal` aborted mid-request (`TIMEOUT`); a 5 MiB streamed body (returns the title fast and stops at `maxBytes`); custom `headers` and the default `User-Agent` asserted by the server; injected `fetch` returning a `Response` built by hand (proves the library needs nothing but WHATWG APIs); `URL` object input; `ftp:`, `javascript:`, `data:` and relative strings give `INVALID_URL`; the 2.x-style destructuring `const {title, error} = await getTitleAtUrl(url)` still holds (`title` set and `error` undefined on success, the reverse on failure) | Every CI job, both builds |
| 3. CLI | The `bin` entry | Spawn `node dist/cli.mjs` with `child_process.execFile`: title on stdout with exit 0; `error: <message>` on stderr with exit 1 for a 404; usage on stderr with exit 2 when no URL is given; `--help` exit 0; `--version` equals `package.json`; `--json` prints the result object; `--timeout 50` against the slow route exits 1 with `TIMEOUT`; the first line of dist/cli.mjs is `#!/usr/bin/env node` | Every CI job |
| 4. Package shape | The published layout | `publint` (no errors) and `attw --pack .` (no problems for node10, node16-cjs, node16-esm, bundler); a test that runs `npm pack --json` and asserts the file list is exactly dist/index.mjs, dist/index.cjs, dist/index.d.mts, dist/index.d.cts, dist/cli.mjs with their `.map` files, `package.json`, `README.md`, `LICENSE`, `CHANGELOG.md`, and that the tarball is under 40 kB (as built on 2026-09-25: no dist/cli.mjs.map in the tarball and a 50 kB budget, see the Stage 1 notes); a static check that dist/index.mjs and dist/index.cjs contain no `node:` import, no `require(` of a builtin, no `process.` and no `Buffer` (the library must stay portable; only dist/cli.mjs may use Node) | Node 24 job |
| 5. Consumer fixtures | Each artifact from a consumer's side | `test/consumers/` holds small projects that install the packed tarball into a temp copy and run: `esm-node` (`"type": "module"`; default and named imports; `import def === getTitleAtUrl`; a fixture-server call; `instanceof GetTitleError`), `cjs-node` (`require` gives an object whose `getTitleAtUrl` and `default` are the same function; same calls), `ts-nodenext-esm` and `ts-nodenext-cjs` (`tsc --noEmit` with `module: nodenext` in an ESM and in a CommonJS package, proving `.d.ts` and `.d.cts` resolve), `ts-bundler` (`moduleResolution: bundler`), `ts-node10` (legacy resolution through the top-level `types` field), `bin` (`npx get-title-at-url <fixture url>` inside the fixture project, proving the bin link and the `.cmd` shim on Windows). The type fixtures carry `Expect` and `Equal` helper-type assertions: the result union narrows on `error`, `extractTitle` returns `string | undefined`, `GetTitleOptions` fields are optional, the default export type equals the named one | Every Node job; the bin fixture also on Windows and macOS |
| 6. Other runtimes | Bun and Deno, edge and browsers | Bun job: `bun test/consumers/esm-node/index.js` and `bunx --bun get-title-at-url <fixture url>` after installing the tarball. Deno job: `deno run --allow-net --allow-read --node-modules-dir=manual test/consumers/esm-node/index.js` against the npm-created `node_modules` (verify the flag name during implementation; the research note has the current Deno docs). Edge and browsers: the static portability check from layer 4 plus the injected-`fetch` test from layer 2; an optional later job runs `extractTitle` in Chromium through Playwright, and a `workerd` (`wrangler dev`) smoke is optional too | Bun and Deno jobs in `ci.yml` |
| 7. Coverage | Nothing important is untested | `c8` over the `node --test` run, source maps mapping `dist/` back to `src/`, thresholds 95 percent lines and 90 percent branches, lcov stored as a CI artifact | Node 24 job |
| 8. Live smoke (opt-in) | Real sites still work | `LIVE_TESTS=1 npm run test:live`: example.com must give `Example Domain`; google.com and yahoo.com (the 2.0.0 tests) must give a non-empty title and, after site-name stripping, `Google` and `Yahoo`. Never part of the PR gate; runs weekly on a schedule and on manual dispatch, and its failure opens nothing automatically, it just shows red on the Actions tab | `live.yml`, weekly |
| 9. Post-publish | The registry artifact, in every environment | `verify-published.yml` (manual with a version input, and called by `release.yml` after publishing, with a short wait for registry propagation; as built on 2026-09-25 it is run by hand after Mark approves the staged version, because a staged version is not on the registry before that, see the Stage 2 notes): on Ubuntu, Windows and macOS with Node 20, 22, 24 and 26, plus Bun and Deno (`deno run -A npm:get-title-at-url@<version>`), install `get-title-at-url@<version>` from npmjs.com, run the consumer fixtures against it, run `npx get-title-at-url https://example.com/`, and run `npm audit signatures` so the provenance attestation is verified, not just displayed | After every publish |

Functional and unit suites (layers 1 and 2) run twice in one process, once importing ../dist/index.mjs and once ../dist/index.cjs, through a small loop over the two module paths, so both builds get the full suite on every Node line without duplicating test code.

### Matrix

| Artifact | Node 20, 22, 24, 26 (Ubuntu) | Node 24 (Windows, macOS) | Bun | Deno | Edge and browsers |
|---|---|---|---|---|---|
| dist/index.mjs (ESM) | layers 1, 2, 5 | layers 1, 2, 5 | layer 6 | layer 6 | layer 4 static check, layer 2 injected fetch |
| dist/index.cjs (CJS) | layers 1, 2, 5 | layers 1, 2, 5 | layer 6 (`require` in Bun) | not applicable | not applicable |
| dist/index.d.mts and `.d.cts` | layer 5 type fixtures, layer 4 attw | layer 5 | no | no | no |
| dist/cli.mjs (bin) | layers 3, 5 | layers 3, 5 (shim) | layer 6 | layer 6 | not applicable |
| Tarball | layer 4 | no | no | no | no |
| Registry package | layer 9 | layer 9 | layer 9 | layer 9 | no |

### Test tooling and where the code lives

- Runner and assertions: `node:test` and `node:assert/strict` (built in). Coverage: `c8`. Types: `typescript` (`tsc --noEmit`). Shape: `publint`, `attw`. Nothing else.
- Layout: test/unit/extract-title.test.js, test/functional/get-title-at-url.test.js, test/cli/cli.test.js, test/package/shape.test.js, `test/consumers/<fixture>/` (each with its own `package.json` and a `run.js` or `tsconfig.json`), test/helpers/fixture-server.js, test/live/live.test.js.
- Scripts: `test` (build, then `node --test test/unit test/functional test/cli test/package`), `test:consumers` (pack once, then each fixture), `test:live`, `coverage` (`c8 --check-coverage ... npm test`), `check` (publint, attw, pack dry run).
- The old `test.js` cases map to: "support help shortcut" and "can handle Yahoo" become live smoke cases; "Won't work with an invalid url" and "Shouldn't work with a 404" become functional cases with exact error codes.

## Pull requests and issues: review and disposition

Reviewed 2026-09-24 against the diffs and the advisories they cite. No fork is ahead of `master` (connect3world, mjarraya and gitter-badger are 9, 13 and 47 commits behind), so there is no outside work to pull in.

| PR | What it changes | Is the concern valid? | Merge? | Disposition |
|---|---|---|---|---|
| #9 (Dependabot, 2023-01-09) | lockfile only: json5 1.0.1 to 1.0.2 (prototype pollution; the CVE-2021-44906 in the PR body is json5's changelog line about minimist, not this fix) | Yes, but json5 is in the dev tree (babel, brought in by nyc and coveralls) | No | Superseded: v3 removes nyc and coveralls; the new lockfile has no json5 1.x |
| #10 (Dependabot, 2023-03-15) | lockfile only: webpack 5.75.0 to 5.76.1 (CVE-2022-37603, GHSA-3rfm-jhwj-7488) | Yes, dev tree only (webpack comes in through snyk) | No | Superseded: snyk is removed |
| #11, #12, #13, #15, #16, #17, #18 (Snyk) | `axios` range from `^1.1.3` to 1.6.0, 1.6.3, 1.6.4, 1.7.8, 1.8.2, 1.8.3, 1.12.0 (CVE-2023-45857 token leak, ReDoS, prototype pollution, SSRF in 1.8.x, unbounded `data:` URI in 1.12.0) | Yes, every one is a real advisory against the axios versions the 2.0.0 lockfile pins. For consumers the effect is small: the published range `^1.1.3` already resolves to axios 1.20.0 on a fresh install, so only consumers with a stale lockfile of their own are exposed, and a new `get-title-at-url` version cannot change their lockfile | No, each is obsolete once a later one exists; seven competing lockfile edits | Superseded: v3 has no axios. Close with a comment naming the advisory and pointing at the 3.0.0 changelog |
| #14 (Snyk, 2024-09-09) | `axios` to `^1.6.8` and `meow` to `^12.1.0` (SNYK-JS-SEMVER-3247795 ReDoS through meow 11's normalize-package-data, two follow-redirects issues) | Yes, and this is the one PR that touches the CLI's own tree: meow 11 pulls `semver` 7.3.8 at runtime (`npm ls semver --omit=dev` confirms). meow 12 bundles its dependencies, so the semver path disappears | No, for the same lockfile reason | Superseded: v3 uses meow 14, which has zero dependencies |
| #19 (Snyk, 2026-02-15) | `axios` to `^1.13.5` (SNYK-JS-AXIOS-15252993 prototype pollution) | Yes, the most current axios fix; mergeable and clean | Only as a stopgap | If 3.0.0 slips past 2026-10-31, merge #19 plus the meow line from #14, regenerate the lockfile, run the tests, and publish 2.0.1 from Mark's machine (`npm login` with 2FA; no workflow exists yet). Otherwise close with the others |

Verdict: the bots were right about the problems and wrong about the cure. Merging any of them changes the repo's lockfile and nothing a consumer installs; the fix that reaches consumers is a release that removes the dependencies, which is 3.0.0. Close all eleven when Stage 0 runs, with a comment that names the advisory and says the 3.0.0 line has no runtime dependencies.

| Issue | State | Assessment | Disposition |
|---|---|---|---|
| #6 "Many Warnings!" (2022-10-23) | Open | The reporter installed 1.1.8, whose runtime dependencies were `request`, `meow` 3 and `article-title` 2; the deprecation warnings (request, har-validator, uuid 3) and the 7 high findings came from `request`. The reply at the time attributed the warnings to coveralls (a dev dependency), which was not the cause. 2.0.0 (2022-11-29) replaced `request` with axios and resolved the report, but the issue was never closed | Comment with the accurate history and close it when 3.0.0 is published (zero runtime dependencies, `npm install` prints nothing). Do it in Stage 3 |
| #3 "It's not working for https://www.yahoo.com/" (closed) | Closed | The error text is a browser CORS failure (`Access-Control-Allow-Origin`), not a bug in the package. Yahoo served the page; the browser refused the response. Nothing in the package can fix CORS | v3 README gets a "Browsers" section: `getTitleAtUrl` needs a same-origin proxy in a browser; `extractTitle` works on any HTML you already have. Keep the yahoo.com case in the live smoke suite |
| Repo description (metadata, not an issue) | Wrong | Still says the package combines article-title with `request` | Fixed in Stage 0 |

## Next single action

Mark approves the staged 3.0.0-beta.1 on npmjs.com (Staged Packages tab, 2FA) and says so; then the agent runs the rehearsal checks in Stage 3's second item and `verify-published.yml` with `3.0.0-beta.1`.
