---
title: "v4 research: Node 24 floor, require(esm), TextDecoder, TypeScript 7, JSR (September 2026)"
kind: note
status: active
date: 2026-09-25
verified: 2026-09-25
stale_after: 2027-01-01
tags: [v4, node, require-esm, textdecoder, windows-1252, typescript-7, jsr, research]
aliases: [node 22 end of life, node 24 floor, esm only, jsr publish]
summary: "read before starting v4 or JSR: Node end-of-life dates, require(esm) status, the Node 24.0-24.13.0 windows-1252 bug, TypeScript 7 vs xo, JSR's lack of approval (checked 2026-09-25)"
---

# v4 research: Node 24 floor, require(esm), TextDecoder, TypeScript 7, JSR (September 2026)

## Summary

Facts behind [../plans/2026-09-25-v4-raise-the-floor-to-node-24-when-node-22-reaches-end-of-li.md](../plans/2026-09-25-v4-raise-the-floor-to-node-24-when-node-22-reaches-end-of-li.md), checked on 2026-09-25 from the primary sources named with each item. Re-verify anything older than three months before acting on it (AGENTS.md).

## Node release schedule

- End of life: Node 20 on 2026-04-30 (already), Node 22 on 2027-04-30, Node 24 on 2028-04-30 (maintenance from 2026-10-20), Node 26 on 2029-04-30 (Active LTS from 2026-10-28).
- Node 26 is the last line on the old cadence. From Node 27 there is one major a year, every line becomes LTS, and each is supported for 36 months: 27.0.0 in April 2027 (LTS October 2027), 28.0.0 in April 2028. So v4 ships at about the time Node 27.0.0 does.
- Sources: github.com/nodejs/Release schedule.json; nodejs.org/en/blog/announcements/evolving-the-nodejs-release-schedule.

## require(esm)

- Unflagged from 20.19.0, 22.12.0 and 23.0.0; no warning from 20.19.0, 22.13.0 and 23.5.0; stable (no longer experimental) from 24.15.0 and 25.4.0. Every 24.x and 26.x loads an ES module through `require()` without a flag or a warning, unless the graph uses top-level await (`ERR_REQUIRE_ASYNC_MODULE`).
- `require()` returns the namespace: named exports, `default`, `__esModule: true`. v3's CJS build exports `getTitleAtUrl`, `default`, `extractTitle` and `GetTitleError`, so an ESM-only v4 would look almost the same to `require()` callers.
- TypeScript types for a CommonJS caller of an ESM-only package: `--module nodenext` from TypeScript 5.8, `--module node20` from 5.9; `node16` and `node18` still reject it; TypeScript 7 removed `moduleResolution node10`. attw needs `--profile esm-only` for an ESM-only package.
- Sources: nodejs.org/docs/latest-v24.x/api/modules.html and the v22 page; the TypeScript 5.8 and 5.9 release notes; the attw CLI README.

## TextDecoder and windows-1252

- A Latin-1 fast path (nodejs/node PR 55275) broke windows-1252 decoding in 20.18.3, 22.13.0 and 23.4.0: bytes 0x80 to 0x9F became C1 controls (issues 56219 and 56542). Fixed by PR 60893 in 25.4.0, 24.13.1 and 22.22.1; Node 20 never got the fix. Node 24.0.0 to 24.13.0 are still wrong; every 26.x is right.
- Checked locally on Node 24.18.0: the windows-1252, latin1, iso-8859-1, us-ascii and ascii labels all decode 0x80, 0x92, 0x96 and 0x9F to U+20AC, U+2019, U+2013 and U+0178.
- Deno decodes with encoding_rs (WHATWG); Bun maps 0x80 to U+20AC since its PR 41701 (first version not confirmed); browsers follow the WHATWG Encoding Standard.
- Sources: github.com/nodejs/node pull 60893 and issue 56542; CHANGELOG_V24.md; github.com/oven-sh/bun pull 41701.

## Web platform

- `AbortSignal.any`: Baseline widely available since 2026-09-19 (Chrome and Edge 116, Firefox 124, Safari 17.4); Node 20.3.0, Deno 1.39, Bun 1.1.4.
- `URL.canParse`: Baseline widely available since 2026-06-07 (Chrome and Edge 120, Firefox 115, Safari 17); Node 19.9.0, Deno 1.33, Bun 1.0.2.
- Sources: web-platform-dx web-features explorer; mdn/browser-compat-data.

## Tooling (npm registry)

- tsdown 0.23.0 (2026-09-03), still pre-1.0, runs on Node ^22.18, ^24.11 or >=26; rolldown 1.2.11 (1.0.0 on 2026-05-07).
- TypeScript 7.0 on 2026-07-08, `latest` is 7.0.2; no stable JS API until 7.1. tsdown accepts TypeScript 7 as a peer (its dts plugin switches to an experimental tsgo generator).
- xo 5.0.1 (5.0.0 on 2026-09-16) bundles TypeScript ^6.0.3; typescript-eslint 8.70.1 requires TypeScript below 6.1.0. Lint cannot run on TypeScript 7 yet.
- publint 0.3.24, attw (the arethetypeswrong CLI) 0.18.5.
- Sources: devblogs.microsoft.com/typescript/announcing-typescript-7-0; github.com/sxzz/rolldown-plugin-dts; registry.npmjs.org.

## JSR (for the optional Stage 5)

- JSR publishes the raw TypeScript: no build, so no `define`. `PACKAGE_VERSION` would fall back to `0.0.0-development` in the User-Agent; a generated `version.ts` or a JSON import would fix it. `src/cli.ts` reads `../package.json` through `createRequire`, which would not survive as published. JSR documents no `bin` support for its npm compatibility layer; Deno users could run a `./cli` export.
- `jsr.json` needs `name` (scoped), `version`, `exports`, and a license. Publishing from GitHub Actions: the owner creates the scope and package on jsr.io and links the repository; the job needs `id-token` set to write and runs `npx jsr publish`; a package can require that every version comes from Actions.
- No staging or approval: a version is live and immutable at once; it can be yanked, and deleted only within 24 hours.
- Sources: jsr.io/docs/publishing-packages, jsr.io/docs/scopes, jsr.io/docs/immutability, jsr.io/docs/troubleshooting.

Related: see also [../solutions/2026-09-25-node-20-textdecoder-decodes-windows-1252-bytes-0x80-0x9f-as-.md](../solutions/2026-09-25-node-20-textdecoder-decodes-windows-1252-bytes-0x80-0x9f-as-.md); builds on [2026-09-24-node-npm-ecosystem-september-2026.md](2026-09-24-node-npm-ecosystem-september-2026.md).
