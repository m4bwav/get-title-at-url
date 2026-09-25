---
title: "v4: raise the floor to Node 24 when Node 22 reaches end of life"
kind: plan
status: active
date: 2026-09-25
verified: 2026-09-25
stale_after: 2026-10-25
tags: [v4, release, node, plan]
aliases: [v4 plan, node 24 floor, 4.0.0]
summary: "read before any v4 work: decisions V1-V7 with recommendations, the code changes, stages A-D (4.0.0 on or after 2027-04-30)"
---

# v4: raise the floor to Node 24 when Node 22 reaches end of life

## Goal

Publish get-title-at-url 4.0.0 on or after 2027-04-30, the day Node 22 reaches end of life, with `engines.node` raised from `>=20` to `>=24`, and keep everything a consumer relies on: `import` and `require`, types for both, no runtime dependencies, Bun, Deno, edge runtimes and browsers. The only breaking change is the Node floor; anything that would break a caller on Node 24 needs its own decision below.

## Status

2026-09-25: written from the research in [../notes/2026-09-25-v4-research-node-24-floor-require-esm-textdecoder-typescript.md](../notes/2026-09-25-v4-research-node-24-floor-require-esm-textdecoder-typescript.md). Nothing started; no branch. Mark has not read the decisions yet; as with v3, silence means the recommendations stand. Update this section as stages land.

## Decisions (recommendation first; Mark can overrule any of them)

| # | Question | Recommendation | Why | Alternative |
|---|---|---|---|---|
| V1 | Node floor | `engines.node` `>=24` and keep the package's own windows-1252 decoder | Node 24.0.0 to 24.13.0 still decode windows-1252 bytes 0x80 to 0x9F as C1 controls (fixed in 24.13.1); the decoder is small, tested, and also covers older Bun | `>=24.13.1` and hand windows-1252 back to `TextDecoder`: a floor with a patch number surprises people, and the decoder costs nothing to keep |
| V2 | Module format | Keep the dual build: ES module and CommonJS, a declaration file for each | AGENTS.md makes availability the product; a CommonJS caller whose TypeScript uses `module` `node16` or `node18`, or a bundler emitting CommonJS, still needs the `.cjs` build and `.d.cts` | ESM only: `require()` of an ES module works without a flag or warning on every Node 24 and 26, and the tarball would be about half the size, but TypeScript callers would need `module` `node20` (5.9+) or `nodenext` (5.8+), and attw would run with `--profile esm-only`. Revisit for v5 |
| V3 | When | 4.0.0 on or after 2027-04-30; 4.0.0-beta.1 in April 2027 | Dropping Node 22 while it is still supported would push its users to 3.x for nothing; the beta rehearses the release a few weeks ahead | Earlier: legal under semver, no gain |
| V4 | 3.x after 4.0.0 | No maintenance line; if a security fix for 3.x is ever needed, publish it from a `v3` branch under the dist-tag `v3` | 3.x has no dependencies, so the likely fixes are behaviour, which 4.x carries | Keep a `v3` branch from the start |
| V5 | TypeScript 7 | Not a v4 requirement; move when xo supports it (the Dependabot rule says so) | xo 5 and typescript-eslint accept only TypeScript below 6.1 (2026-09-25) | Typecheck on 7 and lint on 6 side by side |
| V6 | Test matrix | Node 24.0.0 (the floor itself), 24, 26 and 27 (once 27.0.0 is out, April 2027) on Ubuntu; 24 on Windows and macOS; Bun; Deno | The floor's first release is where `require(esm)` was still marked experimental and `TextDecoder` was wrong, so it is the release most likely to break | Latest 24 only, as v3 tested latest 20 |
| V7 | JSR | Separate from v4 (the v3 plan's optional Stage 5). If Mark wants it, v4 is the time to move the version string from the build-time `define` into a generated source file | JSR publishes the raw TypeScript, so the `define` never runs, and it has no approval step | Do JSR as its own minor release later |

## What changes in the code (Stage B)

- `package.json`: `engines.node` `>=24`, the description ("Node 24+"), the Node 24 tsconfig base package instead of the Node 20 one (tsconfig.json `extends`). The Node type definitions are already on 24.
- `src/index.ts`: call `AbortSignal.any` directly and drop the forwarding-controller fallback (Baseline widely available since 2026-09-19; Node 20.3+, Bun 1.1.4, Deno 1.39); use `URL.canParse` instead of `new URL` in a try/catch (Baseline since 2026-06-07). Keep the windows-1252 decoder (V1).
- Tests: the Node 20 guard in test/unit/extract-title.test.js (the conformant-decoder reference) and the package shape test's "Node 20 and up" check move to 24; the consumer fixtures need nothing new.
- CI (`ci.yml`) and `verify-published.yml`: the matrix in V6; builds stay on Node 24 because tsdown needs 24.11 or later.
- `release.yml`: if V4 is ever used, pick the dist-tag `v3` for a 3.x version so it cannot become `latest`.
- Docs: README (Node 24 or newer), CHANGELOG ("Breaking: Node 24 or newer" and the removed fallbacks), AGENTS.md ("every Node line in `engines` (24 and up)", the TextDecoder trap reworded for 24.0 to 24.13.0), the Dependabot comment on the Node type definitions.

## Stages

### Stage A: wait (2026-09-25 to 2027-03-31)

- [ ] Nothing to build. Stage 4 of the v3 plan continues (Dependabot, the TypeScript 7 watch).
- [ ] Watch: xo support for TypeScript 7; tsdown 1.0 (its config may change); Node 27's release date.

### Stage B: the change (April 2027, branch `v4`)

- [ ] Re-verify the research note (it will be six months old), then ask Mark about the decisions table if he has not answered.
- [ ] Make the changes above on branch `v4`; `npm run lint`, `npm run typecheck`, `npm test`, `npm run coverage`, `npm run check`, `npm run test:consumers` pass locally; pull request into `master` with CI green, then squash-merge.

### Stage C: rehearsal (April 2027)

- [ ] `npm version 4.0.0-beta.1`, `git push --follow-tags`; `release.yml` stages it under `next` (which also moves `next` off 3.0.0-beta.1); Mark approves on npmjs.com; `verify-published.yml` with `4.0.0-beta.1`.

### Stage D: release (on or after 2027-04-30)

- [ ] Date the changelog heading, `npm version 4.0.0`, `git push --follow-tags`; Mark approves; `verify-published.yml` with `4.0.0`; the checks in the v3 plan's Stage 3 with `@4`.
- [ ] Log the release, rewrite HANDOFF.md, mark this plan done.

## Verification (what "done" means)

The v3 plan's verification checklist, with Node 24.0.0 added: on the floor itself, `import` and `require` both work and the windows-1252 fixtures decode correctly. `npm view get-title-at-url engines` prints `{ node: '>=24' }`.

## Risks and open points

- tsdown is still pre-1.0; a 1.0 release before April 2027 may change `tsdown.config.ts`. The fallback stays two `tsc` passes (v3 plan, Risks).
- Node 27.0.0's date (April 2027) is from the new release schedule; if it slips, V6 runs without it.
- A 3.x fix published after 4.0.0 through today's `release.yml` would move `latest` back to 3.x; V4's dist-tag rule has to land before any such publish.

## Next single action

Nothing until 2027-04-01 beyond Stage 4 upkeep. Then start Stage B's first item.

Related: builds on [2026-09-25-modernization-and-v3-release.md](2026-09-25-modernization-and-v3-release.md); see also [../decisions/2026-09-24-v3-shape-typescript-dual-build-zero-deps.md](../decisions/2026-09-24-v3-shape-typescript-dual-build-zero-deps.md).
