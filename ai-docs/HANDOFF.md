# Handoff

Updated 2026-09-25 (Stage 0 done; Stage 1 verified and pushed as `origin/v3`; pull request not opened). Read this first, then [log.md](log.md) and the plan's Stage 1 notes.

## Current state

- Published: 2.0.0 on npm (2022-11-29), unchanged. Nothing has been published to npm.
- Stage 0 is done (bot PRs closed, stale branches, webhooks and dead settings gone). Mark's open one-time tasks: uninstall the Snyk GitHub app; confirm npm two-factor authentication.
- Stage 1 lives on branch `v3`, pushed to `origin/v3` on 2026-09-25: five commits on top of `a50b53a` plus merges of master's docs, 44 files. TypeScript in `src/`, tsdown build, tests for layers 1 to 5 and 8, README, CHANGELOG, SECURITY, AGENTS.md. All checks pass on Node 24 (186 tests, publint, attw, coverage 100 percent, 7 consumer fixtures, live smoke), the suites also on Node 20.20.2 and 22.23.3, and from a fresh clone. Evidence: the log.
- Mark, 2026-09-25: push everything and hand the rest of the plan to a new session. He did not answer the open points below, so the current choices stand; list them in the pull request body.
- GitHub shows 82 open Dependabot alerts on `master`, all in the old `package-lock.json`; `v3`'s regenerated lockfile audits clean, so they should close when `v3` merges. Check after the merge.
- `ai-docs/`: `v3` now tracks `origin/v3`, so while the pull request is open, commit docs on `v3` with the work (the squash-merge carries them to `master`); after the merge, on `master`. Keep them committed, or the everlast session-end sync commits them itself and may open a separate docs pull request.
- The plan: [plans/2026-09-25-modernization-and-v3-release.md](plans/2026-09-25-modernization-and-v3-release.md). The traps behind the build and test setup: [notes/2026-09-25-v3-build-and-test-traps-tsdown-0-23-xo-5-npm-11-node-test.md](notes/2026-09-25-v3-build-and-test-traps-tsdown-0-23-xo-5-npm-11-node-test.md).

## Open points for Mark (list them in the pull request body)

- Tarball budget: 40.1 kB against the plan's 40 kB, because the library source maps carry the TypeScript source. The test now allows 50 kB. The alternative is not publishing maps (about 17 kB).
- The departures from the plan listed in its Stage 1 notes: no dist/cli.mjs.map in the tarball, og:site_name also stripped as a prefix, the package's own windows-1252 decoder, a CommonJS export object rather than a callable one.

## Dead ends hit

- Node 20's TextDecoder decodes windows-1252 bytes 0x80 to 0x9F as C1 controls: [solutions/2026-09-25-node-20-textdecoder-decodes-windows-1252-bytes-0x80-0x9f-as-.md](solutions/2026-09-25-node-20-textdecoder-decodes-windows-1252-bytes-0x80-0x9f-as-.md).
- c8 `--include src` reports 0 percent until `--exclude-after-remap` is added: [solutions/2026-09-25-c8-reports-0-for-src-when-include-filters-before-source-maps.md](solutions/2026-09-25-c8-reports-0-for-src-when-include-filters-before-source-maps.md).
- `xo --fix` rewrote type annotations in the type fixture into destructuring and so deleted the assertions; re-read type tests after any autofix.
- A fresh clone failed `npm run lint` because xo resolved the package's own name to the not yet built dist/; the type fixture is now ignored by xo.
- `gh api user/installations` returns 403 with the CLI token, so the Snyk uninstall stays a browser task. The everlast privacy lint misreads npm scope names, the Actions id-token line and backticked paths of files not yet written; phrase around them.

## Next single action

Open the pull request `v3` into `master` (`gh pr create --base master --head v3`) with the open points above in its body, then start Stage 2 on the same branch (the plan's Stage 2 list). Nothing reaches npm without Mark: the release workflow only stages, and he approves each version on npmjs.com.
