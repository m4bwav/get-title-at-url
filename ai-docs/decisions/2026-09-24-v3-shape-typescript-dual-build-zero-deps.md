---
title: "v3 shape: TypeScript, dual build, zero deps"
kind: decision
status: active
date: 2026-09-24
verified: 2026-09-24
stale_after: never
tags: [v3, typescript, esm, cjs, fetch, trusted-publishing, tests]
summary: "read before changing the v3 design: why TypeScript with dual ESM/CJS output, zero runtime deps, native fetch, node:test, staged trusted publishing, and why the bot PRs were closed instead of merged"
---

# Decision: v3 is TypeScript, dual ESM and CommonJS, zero runtime dependencies, fetch-based, published by staged trusted publishing

Date: 2026-09-24. Status: proposed. The plan proceeds on these choices unless Mark overrules one; each row of the plan's decisions table maps to a point here.

## Context

`get-title-at-url` 2.0.0 (published 2022-11-29) still works on Node 24, but it carries axios (the source of all 34 runtime-scope Dependabot alerts), article-title with cheerio (11 packages, about 1 MB), is-url (no release since 2018) and meow 11 (which pulls `semver` through normalize-package-data). Its dev tooling points at services that no longer exist (Travis, Coveralls, Codecov) or only produce noise (Snyk: nine open bot PRs). There is no CI, no release, no types, no `exports` map. Mark's direction on 2026-09-24: make the package as available as possible, with a TypeScript version or types, and validate every emitted artifact in every environment.

## Decision

1. Source in TypeScript; `tsdown` emits dist/index.mjs, dist/index.cjs, dist/index.d.mts, dist/index.d.cts and dist/cli.mjs (the config was built and passed publint and attw on 2026-09-25). Both module formats are published so that every consumer, including CommonJS on Node lines without `require(esm)`, can use it.
2. The library has no runtime dependencies: native `fetch` replaces axios, `URL` replaces is-url, and a small in-house extractor (first `<title>`, `og:title` and `twitter:title` fallbacks, `og:site_name` suffix stripping, entity decoding) replaces article-title. The CLI parses its arguments with `parseArgs` from `node:util`, so `meow` goes too and the package installs with no dependencies at all (plan decision D17; keeping meow 14 is the documented alternative).
3. The API keeps the `{title, error}` result and never throws. It adds `url` and `status`, types `error` as `GetTitleError` with a `code`, takes an options object (`timeout`, `signal`, `headers`, `fetch`, `maxBytes`), and exports `extractTitle(html)` for callers who already have HTML (browsers, edge runtimes).
4. `engines.node: ">=20"`; CI tests 20, 22, 24 and 26. Node 20 is past end of life (2026-04-30) and is supported because it costs nothing; it is dropped in v4.
5. Tests use `node:test` with `c8` for coverage, a local fixture server instead of the live internet, consumer fixture projects that install the packed tarball for each artifact (ESM, CJS, types under three resolution modes, the bin), Bun and Deno jobs, and a post-publish workflow that repeats the checks against the registry.
6. Publishing runs in GitHub Actions through npm trusted publishing (OIDC) in staged mode: the workflow stages the version, Mark approves it on npmjs.com with 2FA. No npm token exists anywhere. GitHub Releases are created by the same workflow.
7. Travis, Snyk, Coveralls and Codecov are removed. Dependabot (npm and Actions, weekly, grouped, with the default 3-day cooldown) and `npm audit` in CI replace them.
8. The eleven open bot PRs are closed, not merged: each one only edits the repository's lockfile, which consumers never install, and v3 removes the packages they patch.
9. The default branch stays `master`; `package-lock.json` stays committed (regenerated as lockfileVersion 3).
10. Version 3.0.0, because the Node floor, the result shape (`response` and `body` removed), the error type and the extraction heuristic all change.

## Reasons

- Reach: dual output plus shipped types is the only combination that serves ESM, CommonJS, TypeScript, bundlers, Bun, Deno and edge runtimes from one package.
- Safety: every open security alert traces to axios, cheerio's tree, meow 11's `semver` path or the dead dev tools; removing the packages removes the alerts for good instead of chasing bumps.
- Honesty of the test signal: a fixture server and consumer fixtures fail for reasons in this repository; live-site tests failed for reasons in Google's and Yahoo's HTML.
- Least ceremony that is still safe: `npm version` plus a tag, OIDC instead of tokens, staging as the review gate, Dependabot instead of Snyk.
- Continuity for callers: the `{title, error}` shape survives, so the 2.x README example keeps working.

## Alternatives rejected

- ESM-only output: simpler, and what much of the ecosystem now ships, but `require()` of ESM only works on Node 20.19+ and 22.12+, and the stated goal is reach.
- Keeping article-title 5: proven heuristics, but cheerio is not browser-safe without bundling, adds 1 MB and 11 packages, and its separator regex splits on a bare hyphen (`Node-API docs` becomes `Node`). The useful part of its heuristic (strip a site-name suffix) is reimplemented.
- ava 8 as the runner: needs Node 22.20 or 24.12, which would force the matrix and the floor to 22 for a dev-only reason.
- Merging the Snyk and Dependabot PRs, or publishing a 2.0.1 with newer ranges: neither changes what a consumer with a fresh install gets (`^1.1.3` already resolves to axios 1.20.0), and neither helps a consumer with a stale lockfile. A 2.0.1 stopgap is kept in the plan only if 3.0.0 slips past 2026-10-31.
- Direct `npm publish` from the workflow: allowed by trusted publishing, but since 2026-09-03 staging is the default and GitHub's recommendation; the approval click is the only review gate a solo maintainer has. Revisit if it becomes a chore.
- release-please or changesets: more machinery than a two-file package needs; `npm version` plus a tag does the job.
- Snyk's free tier: it found real advisories but proposed the wrong cure eleven times; Dependabot alerts cover the same feeds.
- `engines.node: ">=22"` (the research note's suggestion): correct for the dev tools, irrelevant to consumers, and against the availability goal.

## Consequences

- Breaking changes for 2.x callers are limited to the removed `response` and `body` fields, the error type, and the heuristic; the common `const {title} = await getTitleAtUrl(url)` keeps working and the changelog lists everything.
- Mark has four one-time tasks: confirm 2FA on npm, configure the trusted publisher, uninstall Snyk from GitHub, and approve each staged publish.
- tsdown is pre-1.0; it is pinned exactly and a plain `tsc` dual build is the documented fallback.
- Pages where article-title preferred an `<h1>` over `<title>` will return the `<title>` in v3; the fixtures record the new behaviour.

Related: builds on [../plans/2026-09-25-modernization-and-v3-release.md](../plans/2026-09-25-modernization-and-v3-release.md); see also [../notes/2026-09-24-node-npm-ecosystem-september-2026.md](../notes/2026-09-24-node-npm-ecosystem-september-2026.md), [../notes/2026-09-24-typescript-library-packaging-september-2026.md](../notes/2026-09-24-typescript-library-packaging-september-2026.md).
