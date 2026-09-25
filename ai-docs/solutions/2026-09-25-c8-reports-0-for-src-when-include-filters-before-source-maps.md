---
title: c8 reports 0% for src when --include filters before source maps are applied
kind: solution
status: active
date: 2026-09-25
verified: 2026-09-25
stale_after: 2026-12-24
tags: [c8, coverage, source-maps, tsdown, node-test]
aliases: [c8 exclude-after-remap, coverage 0 percent, c8 include src]
summary: "read before changing the coverage script: c8 filters --include on dist paths before remapping, so --include src needs --exclude-after-remap; CLI coverage needs dist/cli.mjs.map"
---

# c8 reports 0% for src when --include filters before source maps are applied

## Problem

`c8 --include src --reporter text node --test ...` over tests that import the built `dist/` files printed `All files | 0 | 0 | 0 | 0` and listed no source file at all, although tsdown writes source maps that point back to `src/`.

## Dead ends

- The source maps were fine: the same run without `--include` reported the files under `src/` through the maps.

## Fix

c8 applies `--include` and `--exclude` to the generated file paths (`dist/...`) before it applies the source maps, so `--include src` removed everything. `--exclude-after-remap` moves the filter after the remapping. Quote the glob so a POSIX shell does not expand it:

```bash
c8 --check-coverage --lines 95 --branches 90 --exclude-after-remap --include "src/**" --reporter text --reporter lcov node --test <test files>
```

The CLI is covered through the child processes the CLI tests spawn (c8 passes `NODE_V8_COVERAGE` down), which needs `dist/cli.mjs.map`; that map is built but kept out of the tarball by `files`.

## Verified by

`npm run coverage` on 2026-09-25 (c8 12.0.0, tsdown 0.23.0, Node 24.18.0): `All files | 100 | 100 | 100 | 100`, with `cli.ts`, `errors.ts`, `extract-title.ts` and `index.ts` each at 100.

## Applies when

c8 12 over a bundler's output with source maps; any package whose tests run against `dist/` rather than the source.

Related: builds on [../plans/2026-09-25-modernization-and-v3-release.md](../plans/2026-09-25-modernization-and-v3-release.md).
