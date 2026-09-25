# Handoff

Updated 2026-09-25 (Stage 0 done, Stage 1 started). Read this first, then [log.md](log.md) and the plan.

## Current state

- Published: 2.0.0 on npm (2022-11-29), unchanged. Nothing has been published to npm by this work.
- Mark read the decisions table on 2026-09-25 and kept every recommendation (D1 to D17).
- Stage 0 is done (2026-09-25, evidence in the log): the eleven bot PRs are closed with a comment each, every stale branch is deleted (only `master` remains), the three webhooks are gone, and the repo settings are applied and read back.
- Mark's open one-time tasks: uninstall the Snyk GitHub app (github.com/settings/installations, then the project on app.snyk.io); confirm npm two-factor authentication.
- Stage 1 (the TypeScript rewrite, tsdown build, test layers 1 to 5 and 8, README, CHANGELOG) is in progress on the local branch `v3`, which is not pushed. `ai-docs/` changes are committed on `master` only, so the everlast session-end sync never has to open a docs pull request from `v3`.
- The plan: [plans/2026-09-25-modernization-and-v3-release.md](plans/2026-09-25-modernization-and-v3-release.md). Why: [decisions/2026-09-24-v3-shape-typescript-dual-build-zero-deps.md](decisions/2026-09-24-v3-shape-typescript-dual-build-zero-deps.md).

## Dead ends hit

- `gh api user/installations` returns 403 with the CLI's OAuth token, so the Snyk app uninstall stays a browser task.
- The everlast privacy lint reads npm scope names as personal handles, the Actions id-token permission line as a credential, and backticked paths of files that do not exist yet as dead links; write them without the at-sign, as "id-token set to write", and without code formatting.

## Next single action

Continue Stage 1 on branch `v3` (`git switch v3`) from the plan's Stage 1 checklist; stop before opening the pull request.
