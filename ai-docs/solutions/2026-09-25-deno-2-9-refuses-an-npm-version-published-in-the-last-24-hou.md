---
title: Deno 2.9 refuses an npm version published in the last 24 hours
kind: solution
status: active
date: 2026-09-25
verified: 2026-09-25
stale_after: 2026-12-24
tags: [deno, npm, verify-published, minimum-dependency-age, release]
aliases: [deno minimum dependency age, deno min-dep-age, Could not find npm package matching]
summary: "read before running a just-published version through Deno: since 2.9 npm: skips versions under 24 hours old unless --minimum-dependency-age=0"
---

# Deno 2.9 refuses an npm version published in the last 24 hours

## Problem

`verify-published.yml` runs minutes after Mark approves a staged version. Its Deno step, `deno run -A "npm:get-title-at-url@3.0.0-beta.1" https://example.com/`, failed on Deno 2.9.7 (run 36154884494):

```
error: Could not find npm package 'get-title-at-url' matching '3.0.0-beta.1'.
A newer matching version was found, but it was not used because it was newer than the specified minimum dependency date
```

The package was fine: every Node job, Bun, and Deno's own consumer fixtures (run through the `node_modules` that npm installed) passed in the same run.

## Dead ends

- None tried; Deno's hint names the policy. Waiting a day would also have worked, but the workflow exists to check a version right after the approval.

## Fix

Since Deno 2.9, npm specifiers skip versions published in the last 24 hours by default (the minimum dependency age policy, docs.deno.com/go/minimum-dependency-age). `--minimum-dependency-age=0` turns it off for one command; the value also takes minutes, an ISO-8601 duration (`P3D`) or a cutoff date, and `"minimumDependencyAge"` sets it in deno.json.

```bash
deno run -A --minimum-dependency-age=0 "npm:get-title-at-url@<version>" https://example.com/
```

Only the step that resolves `npm:` from the registry needs it. Deno running files against a `node_modules` that npm created (`--node-modules-dir=manual`) does not consult the policy.

## Verified by

verify-published run 36155346459 on 8550db9, 2026-09-25: all 15 jobs green with 3.0.0-beta.1 about 20 minutes after the approval, including the Deno job on Deno 2.9.7.

## Applies when

Any workflow, test or instruction that runs a just-published npm version through Deno 2.9 or later: post-publish checks, the verification checklist's manual Deno line, a user trying a release on its first day.

Related: builds on [../plans/2026-09-25-modernization-and-v3-release.md](../plans/2026-09-25-modernization-and-v3-release.md).
