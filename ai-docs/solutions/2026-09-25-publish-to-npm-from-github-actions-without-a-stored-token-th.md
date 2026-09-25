---
title: Publish to npm from GitHub Actions without a stored token, through trusted publishing in staged mode
kind: solution
status: active
date: 2026-09-25
verified: 2026-09-25
stale_after: 2026-12-24
tags: [npm, trusted-publishing, oidc, staged-publishing, provenance, github-actions, release]
aliases: [npm trusted publisher setup, npm stage publish, npm stage approve, staged packages tab, npm OIDC publish]
summary: "read before setting up or changing npm releases: the release.yml shape, the exact npmjs.com Trusted Publisher fields, how Mark approves a staged version, and how to verify it"
---

# Publish to npm from GitHub Actions without a stored token, through trusted publishing in staged mode

## Problem

Release get-title-at-url from GitHub Actions with no npm token stored anywhere, with provenance, and with a person approving each version before it goes live.

## Dead ends

- A prerelease staged without `--tag` is refused by npm 11.19 ("You must specify a tag using --tag when publishing a prerelease version"), so the workflow always passes `--tag next` or `--tag latest`.
- Node 22 ships npm 10.9, which can neither exchange an OIDC token (needs 11.5.1) nor stage (needs 11.15); the publishing job runs on Node 24.
- The post-publish Deno check failed within 24 hours of the approval: [2026-09-25-deno-2-9-refuses-an-npm-version-published-in-the-last-24-hou.md](2026-09-25-deno-2-9-refuses-an-npm-version-published-in-the-last-24-hou.md).

## Fix

1. Workflow (`.github/workflows/release.yml`, triggered by a `v*` tag). A read-only `build` job checks the tag against `package.json` and the changelog, runs every test and packs the tarball. A `publish` job, the only one with `id-token` and `contents` set to write, runs no dependency code: `actions/setup-node` with Node 24, `registry-url: https://registry.npmjs.org` and `package-manager-cache: false`; a check that npm is 11.15 or later; then

   ```bash
   npm stage publish "./get-title-at-url-$VERSION.tgz" --tag "$DIST_TAG"   # next for x.y.z-beta.N, latest otherwise
   ```

   No `NODE_AUTH_TOKEN` and no `--provenance`: npm swaps the job's OIDC token for a short-lived one and signs provenance itself (public repository, public package). `package.json` `repository.url` is `git+https://github.com/m4bwav/get-title-at-url.git`, which matches.
2. npmjs.com, once (the package owner, in a browser): the package's Settings, Trusted Publisher, publisher GitHub Actions. Organization or user `m4bwav`, Repository `get-title-at-url`, Workflow filename `release.yml` (filename only; it must exist in `.github/workflows/`), Environment name blank, Label optional. `npm stage publish` is always allowed; leave "Allow npm publish" unticked so the workflow can only stage. The provider and required fields cannot be changed later (delete and recreate), and renaming the workflow file breaks publishing. Publishing access: "Require two-factor authentication and disallow bypass 2fa tokens (recommended)"; the page says it works with trusted publishers.
3. Release: dated changelog heading, `npm version <version>`, `git push --follow-tags`. The run logs "Staging to https://registry.npmjs.org/ with tag <tag>", "staged with id <uuid>" and a sigstore transparency-log entry, then creates the GitHub Release.
4. Approve: npmjs.com, the package's Staged Packages tab, Approve, then the 2FA prompt (`npm stage approve <stage-id>` from a logged-in CLI also works, with 2FA). The version keeps the dist-tag it was staged with.
5. Verify: `npm view <pkg> dist-tags`; `npm audit signatures` in a project that installed it (a verified registry signature and a verified attestation); `gh workflow run verify-published.yml -f version=<version>`.

## Verified by

2026-09-25. 3.0.0-beta.1: release run 36153096874 staged it under `next`; after Mark's approval `latest` stayed 2.0.0 and `next` was 3.0.0-beta.1; verify-published run 36155346459 green in 15 jobs. 3.0.0: release run 36155632874 staged it under `latest` (stage id d5077ead); after the approval `npm view get-title-at-url dist-tags` gave latest 3.0.0, `npm audit signatures` verified 1 signature and 1 attestation, and verify-published run 36156488030 green in all 15 jobs (Node 20, 22, 24 and 26 on Ubuntu, Windows and macOS, Bun, Deno).

## Applies when

A public package already on npm, released from a public GitHub repository, with npm 11.15 or later on the runner. The Trusted Publisher settings live on the package's page; how a package that has never been published gets its first version this way was not checked.

Related: builds on [../plans/2026-09-25-modernization-and-v3-release.md](../plans/2026-09-25-modernization-and-v3-release.md); builds on [../decisions/2026-09-24-v3-shape-typescript-dual-build-zero-deps.md](../decisions/2026-09-24-v3-shape-typescript-dual-build-zero-deps.md).
