# Handoff

Updated 2026-09-25 (Stage 3: 3.0.0-beta.1 rehearsal done; 3.0.0 staged on npm, waiting for Mark's approval). Read this first, then [log.md](log.md) and, in the plan, Stage 3.

## Current state

- npm: `latest` 2.0.0, `next` 3.0.0-beta.1 (approved by Mark; the approval kept the staged tag). 3.0.0 is staged under `latest`, stage id d5077ead-4a84-4a01-a8e7-639baa371096, from release run 36155632874 (186 of 186 tests, publint and attw clean, tarball 40.1 kB, provenance signed). GitHub Releases v3.0.0-beta.1 (prerelease) and v3.0.0 exist.
- `master` at be8eb1b "3.0.0" with tag v3.0.0; CI green (run 36155633675). Dependabot alerts: 0 open.
- Rehearsal: verify-published run 36155346459 green in all 15 jobs for 3.0.0-beta.1, after 8550db9 let Deno 2.9 run a version under 24 hours old: [solutions/2026-09-25-deno-2-9-refuses-an-npm-version-published-in-the-last-24-hou.md](solutions/2026-09-25-deno-2-9-refuses-an-npm-version-published-in-the-last-24-hou.md).
- Trusted publisher on npmjs.com: added by Mark (GitHub Actions, m4bwav / get-title-at-url, release.yml, environment blank, direct publish not allowed); publishing access requires 2FA and disallows bypass tokens. Snyk: OAuth app revoked by Mark, no GitHub App, nothing left in the repository (log).
- The npm page shows the README of `latest`, so its dead badges (2.0.0's README) go away when 3.0.0 is approved; the v3 README's three badges all resolve.
- The pull request body's "For review" points (50 kB tarball budget with source maps; the four Stage 1 departures) stand; approving 3.0.0 settles them.
- Docs: commit and push them on `master`. Issue #6 comment drafted in the session, to post after 3.0.0 is verified (text follows the plan's issue table: the warnings came from `request` in 1.1.8).
- The plan: [plans/2026-09-25-modernization-and-v3-release.md](plans/2026-09-25-modernization-and-v3-release.md). Build and test traps: [notes/2026-09-25-v3-build-and-test-traps-tsdown-0-23-xo-5-npm-11-node-test.md](notes/2026-09-25-v3-build-and-test-traps-tsdown-0-23-xo-5-npm-11-node-test.md).

## Waiting on Mark

1. Approve the staged 3.0.0 on npmjs.com: the package's Staged Packages tab, Approve, 2FA. Then tell the agent.

## Next single action

After the approval: `npm view get-title-at-url version` (3.0.0) and dist-tags, `npx -y get-title-at-url@3 https://example.com/`, import and require in a temp project, `npm audit signatures`, `gh release view v3.0.0`, then `gh workflow run verify-published.yml -f version=3.0.0` and watch it. Then close issue #6 with the comment, write the trusted-publishing solution entry, and rewrite this file around Stage 4.

## Dead ends hit

- The CI package job failed once: publint packs without lifecycle scripts, so `npm run check` needs a build first.
- In Git Bash an ANSI-C quoted carriage return is empty inside a command substitution, so a CRLF check with grep there matches every line; count byte 13 with node instead.
- `gh pr merge --match-head-commit` needs the full SHA; a guessed one is refused ("Head branch was modified").
- Deno 2.9 skips npm versions under 24 hours old by default; `deno run --minimum-dependency-age=0` (solution entry above).
- `gh api user/installations` returns 403 (needs a GitHub App token), so the installed-apps list is a browser check. The everlast privacy lint misreads npm scope names, the Actions id-token line and backticked paths of files not yet written; phrase around them.
