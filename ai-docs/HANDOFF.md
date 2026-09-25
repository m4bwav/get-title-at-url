# Handoff

Updated 2026-09-25 (Stages 1 and 2 done and merged; Stage 3 waits for Mark to add the npm trusted publisher). Read this first, then [log.md](log.md) and, in the plan, the Stage 2 notes and Stage 3.

## Current state

- Published: 2.0.0 on npm (2022-11-29), unchanged; nothing has been published to npm. Every fresh install of 2.0.0 has thrown on import since cheerio 1.0.0 (2024-08-09), see the log, so 3.0.0 also replaces a broken release.
- `master` holds v3: pull request #20 (the TypeScript rewrite plus the Stage 2 GitHub setup) squash-merged as 8f43080. CI green on the pull request (run 36148707435) and on `master` (run 36149048659). Dependabot alerts: 0 open. `origin/v3` was deleted by the merge; the local `v3` branch is fully merged.
- Workflows: `ci.yml` (ruleset 24003504 on `master` requires its final `ci` job; the admin bypasses it, so direct pushes by m4bwav work), `release.yml` (on a `v*` tag: a read-only build job, then a publish job that stages the tested tarball with `npm stage publish --tag next` or `latest` and creates the GitHub Release), `verify-published.yml` (manual, version input), `live.yml` (weekly). Dependabot weekly for npm and the actions.
- The pull request body's "For review" points (50 kB tarball budget with source maps; the four Stage 1 departures) stand; Mark can still change them before 3.0.0.
- Docs: commit and push them on `master` from now on.
- The plan: [plans/2026-09-25-modernization-and-v3-release.md](plans/2026-09-25-modernization-and-v3-release.md). Build and test traps: [notes/2026-09-25-v3-build-and-test-traps-tsdown-0-23-xo-5-npm-11-node-test.md](notes/2026-09-25-v3-build-and-test-traps-tsdown-0-23-xo-5-npm-11-node-test.md).

## Waiting on Mark

1. Add the trusted publisher on npmjs.com: the package's Settings, Trusted publishing, GitHub Actions; user m4bwav, repository get-title-at-url, workflow filename release.yml, environment blank, allowed actions stage only (leave direct npm publish unticked). Then tell the agent.
2. Confirm npm two-factor authentication (approving a staged version needs it).
3. Uninstall the Snyk GitHub app (github.com/settings/installations) and remove the project at app.snyk.io.
4. Later: approve each staged version on npmjs.com; once 3.0.0 is out, set "Require two-factor authentication and disallow tokens".

## Next single action

When Mark confirms the publisher: on `master`, `npm version 3.0.0-beta.1`, `git push --follow-tags`, and watch `release.yml` stage the beta under the next tag. Stop for Mark's approval; then run the rehearsal checks in the plan's Stage 3 and `verify-published.yml` with 3.0.0-beta.1.

## Dead ends hit

- The CI package job failed once: publint packs without lifecycle scripts, so `npm run check` needs a build first.
- In Git Bash an ANSI-C quoted carriage return is empty inside a command substitution, so a CRLF check with grep there matches every line; count byte 13 with node instead.
- `gh pr merge --match-head-commit` needs the full SHA; a guessed one is refused ("Head branch was modified").
- Node 20's TextDecoder and windows-1252: [solutions/2026-09-25-node-20-textdecoder-decodes-windows-1252-bytes-0x80-0x9f-as-.md](solutions/2026-09-25-node-20-textdecoder-decodes-windows-1252-bytes-0x80-0x9f-as-.md). c8 and `--exclude-after-remap`: [solutions/2026-09-25-c8-reports-0-for-src-when-include-filters-before-source-maps.md](solutions/2026-09-25-c8-reports-0-for-src-when-include-filters-before-source-maps.md).
- `gh api user/installations` returns 403 with the CLI token, so the Snyk uninstall stays a browser task. The everlast privacy lint misreads npm scope names, the Actions id-token line and backticked paths of files not yet written; phrase around them.
