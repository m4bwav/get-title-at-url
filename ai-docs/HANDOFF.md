# Handoff

Updated 2026-09-25 (Stage 3 rehearsal: 3.0.0-beta.1 staged on npm, waiting for Mark's approval). Read this first, then [log.md](log.md) and, in the plan, Stage 3.

## Current state

- Published: 2.0.0 is still `latest` on npm. Every fresh install of 2.0.0 has thrown on import since cheerio 1.0.0 (2024-08-09), see the log, so 3.0.0 also replaces a broken release.
- `master` holds v3 (pull request #20, squash-merged as 8f43080) plus the version commit e26bf22 "3.0.0-beta.1" and the annotated tag `v3.0.0-beta.1`. CI green on e26bf22 (run 36153098994). Dependabot alerts: 0 open.
- Trusted publisher on npmjs.com: added by Mark (GitHub Actions, m4bwav / get-title-at-url, release.yml, environment blank, direct `npm publish` not allowed). Publishing access requires 2FA and disallows bypass tokens.
- Release run 36153096874 (tag v3.0.0-beta.1) green: 186 of 186 tests, publint and attw clean, consumers 7 pass and 5 skipped, tarball 40.2 kB, 11 files. `npm stage publish` staged it "with tag next", stage id f6123f79-4603-46ce-91b8-23d82362cb18, provenance signed (sigstore log index 2957911315). GitHub prerelease v3.0.0-beta.1 exists.
- The pull request body's "For review" points (50 kB tarball budget with source maps; the four Stage 1 departures) stand; Mark can still change them before 3.0.0.
- Docs: commit and push them on `master`.
- The plan: [plans/2026-09-25-modernization-and-v3-release.md](plans/2026-09-25-modernization-and-v3-release.md). Build and test traps: [notes/2026-09-25-v3-build-and-test-traps-tsdown-0-23-xo-5-npm-11-node-test.md](notes/2026-09-25-v3-build-and-test-traps-tsdown-0-23-xo-5-npm-11-node-test.md).

## Waiting on Mark

1. Approve the staged 3.0.0-beta.1 on npmjs.com: the package's Staged Packages tab, Approve, 2FA (docs.npmjs.com/staged-publishing). Then tell the agent.
2. Snyk: Mark revoked it under GitHub's Authorized OAuth Apps. Still unconfirmed: github.com/settings/installations lists no Snyk app, and the project is gone from app.snyk.io.
3. Later: approve the staged 3.0.0 the same way.

## Next single action

After Mark's approval: `npm view get-title-at-url@next version` (3.0.0-beta.1), `npm view get-title-at-url dist-tags` (`latest` still 2.0.0, `next` 3.0.0-beta.1: the open question of whether approval keeps the staged tag), `npx -y get-title-at-url@next https://example.com/`, `npm audit signatures` in a temp project, then `gh workflow run verify-published.yml -f version=3.0.0-beta.1` and watch it. Then 3.0.0: date the changelog heading, `npm version 3.0.0`, `git push --follow-tags`, stop for approval.

## Dead ends hit

- The CI package job failed once: publint packs without lifecycle scripts, so `npm run check` needs a build first.
- In Git Bash an ANSI-C quoted carriage return is empty inside a command substitution, so a CRLF check with grep there matches every line; count byte 13 with node instead.
- `gh pr merge --match-head-commit` needs the full SHA; a guessed one is refused ("Head branch was modified").
- Node 20's TextDecoder and windows-1252: [solutions/2026-09-25-node-20-textdecoder-decodes-windows-1252-bytes-0x80-0x9f-as-.md](solutions/2026-09-25-node-20-textdecoder-decodes-windows-1252-bytes-0x80-0x9f-as-.md). c8 and `--exclude-after-remap`: [solutions/2026-09-25-c8-reports-0-for-src-when-include-filters-before-source-maps.md](solutions/2026-09-25-c8-reports-0-for-src-when-include-filters-before-source-maps.md).
- `gh api user/installations` returns 403 with the CLI token, so the Snyk uninstall stays a browser task. The everlast privacy lint misreads npm scope names, the Actions id-token line and backticked paths of files not yet written; phrase around them.
