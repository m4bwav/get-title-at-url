# Handoff

Updated 2026-09-25 (3.0.0 released and verified; Stages 0 to 3 of the plan are done, the checklist holds, Stage 4 is standing work). Read this first, then [log.md](log.md) when you need evidence.

## Current state

- npm: `latest` 3.0.0 (approved by Mark 2026-09-25, provenance, no dependencies), `next` 3.0.0-beta.1. GitHub Releases v3.0.0 and v3.0.0-beta.1 (prerelease). `master` holds the release; CI green on every push. Dependabot alerts 0, issue #6 closed, no open pull requests, no webhooks.
- Verified from the registry: verify-published run 36156488030 green in all 15 jobs (Node 20, 22, 24 and 26 on Ubuntu, Windows and macOS, Bun, Deno); locally `npm audit signatures` verified the signature and the attestation. The npm page now shows the v3 README (three working badges).
- How releases work, with the exact npmjs.com fields: [solutions/2026-09-25-publish-to-npm-from-github-actions-without-a-stored-token-th.md](solutions/2026-09-25-publish-to-npm-from-github-actions-without-a-stored-token-th.md). The ritual is in AGENTS.md: dated changelog heading, `npm version`, `git push --follow-tags`, Mark approves in the Staged Packages tab, then run `verify-published.yml` with the version.
- The pull request #20 "For review" points (50 kB tarball budget with source maps; the four Stage 1 departures) were settled by Mark approving 3.0.0 as built.
- After the release: pull request #21 (bdcdcf9) denies unrs-resolver's dev-only install script, so a fresh `npm ci` prints no warnings; the verification checklist was re-checked row by row (plan, under the checklist). The local `v3` branch is deleted (pull request #20 keeps its commits). The vault's saved next-session prompt is marked done; start from this file.
- The plan, now a record: [plans/2026-09-25-modernization-and-v3-release.md](plans/2026-09-25-modernization-and-v3-release.md).

## Stage 4: standing work

1. Dependabot opens npm and GitHub Actions pull requests every Monday. Merge when the `ci` check is green; read the release notes for a major first. tsdown is pre-1.0 and pinned exactly: if a bump breaks the build, the fallback is two `tsc` passes (plan, Risks). Move to TypeScript 7 when tsdown and xo both support it.
2. A patch or minor release follows the ritual above; no beta needed unless release.yml or the npm setup changed. Within 24 hours of a publish Deno needs `--minimum-dependency-age=0` ([solutions/2026-09-25-deno-2-9-refuses-an-npm-version-published-in-the-last-24-hou.md](solutions/2026-09-25-deno-2-9-refuses-an-npm-version-published-in-the-last-24-hou.md)).
3. `live.yml` runs weekly against example.com, google.com and yahoo.com; red there means a real site changed its title, not that the package broke. Nothing opens automatically.
4. Node 26 becomes Active LTS on 2026-10-28 (already in the matrix). Node 22 reaches end of life on 2027-04-30: plan v4 then with `engines.node` ">=24".
5. Optional, Mark's call: `npm dist-tag rm get-title-at-url next` from his own login (2FA) so `next` stops pointing at the beta; the next prerelease would overwrite it anyway. Delete the leftover project at app.snyk.io (it can no longer reach the repository).
6. Optional Stage 5: publish to JSR from the same source; a "title of a URL" tool page on markdavidrogers.com.

## Next single action

Nothing is pending. Start from item 1 when Dependabot pull requests appear.

## Dead ends hit

- The CI package job failed once: publint packs without lifecycle scripts, so `npm run check` needs a build first.
- In Git Bash an ANSI-C quoted carriage return is empty inside a command substitution, so a CRLF check with grep there matches every line; count byte 13 with node instead.
- `gh pr merge --match-head-commit` needs the full SHA; a guessed one is refused ("Head branch was modified").
- `gh api user/installations` returns 403 (it needs a GitHub App token), so the installed-apps list is a browser check.
- The everlast privacy lint reads "token:" followed by a word, and the Actions id-token permission written as YAML, as credentials; phrase around them.
