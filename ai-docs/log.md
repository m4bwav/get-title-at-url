# Log

Append-only. One line per operation: `## [YYYY-MM-DD] op | title` where op is one of add, update, supersede, verify, verify-failed, prune, handoff, index. Newest at the bottom. Never edited, only appended; this is the history the entries themselves do not carry.

## [2026-09-24] init | scaffolded

## [2026-09-24] add | Node.js and npm publishing ecosystem, September 2026 (notes)
## [2026-09-24] index | rebuilt (1 entries)
## [2026-09-24] add | decision: v3 shape: TypeScript, dual build, zero deps
## [2026-09-25] add | note: TypeScript dual publishing and runtime portability
## [2026-09-25] add | plan: Modernization and v3 release
## [2026-09-25] prune | TypeScript dual publishing and runtime portability (notes): removed, superseded by the research agent's fuller note 2026-09-24-typescript-library-packaging-september-2026.md
## [2026-09-25] handoff | 28 lines
## [2026-09-25] index | rebuilt (4 entries)
## [2026-09-24] add | TypeScript dual publishing and runtime portability, September 2026 (notes)
## [2026-09-25] update | TypeScript library packaging for maximum reach, September 2026 (notes): added Summary section and at-sign-free scope names; filename restored to 2026-09-24-typescript-library-packaging-september-2026.md because the handoff and plan link to it; the earlier add line for the dual-publishing name is void
## [2026-09-25] index | rebuilt (4 entries)
## [2026-09-25] index | rebuilt (4 entries)
## [2026-09-25] index | rebuilt (4 entries)
## [2026-09-25] update | AGENTS.md pointer, CLAUDE.md import and Copilot pointer added; baseline recorded (CLI works on Node 24, 4 live tests pass, xo clean); plan, decision, two research notes and HANDOFF written
## [2026-09-25] update | Stage 0: closed bot PRs #9 to #19, one comment each naming the advisory (Snyk ids as cited in each PR body; json5 and webpack by name), and deleted their 11 branches with gh pr close --delete-branch; gh pr list --state open now returns 0
## [2026-09-25] update | Stage 0: deleted develop (0 ahead of master, tip 01b279f) and the two branches left behind by PRs #4 and #5, closed unmerged 2022-11-29 (snyk-fix-6e70e69f tip 9b91bb2, snyk-fix-c9449aa7 tip 25b9fe7; Restore branch on either PR page brings them back); the branches API lists only master
## [2026-09-25] update | Stage 0: deleted webhooks 83047120 (notify.travis-ci.org), 14564186 and 278618458 (snyk.io), HTTP 204 each; the hooks API returns 0
## [2026-09-25] update | Stage 0: repo settings applied and read back: new description, homepage npmjs.com/package/get-title-at-url, 8 topics, wiki and projects off, delete-branch-on-merge on, secret scanning and push protection enabled, private vulnerability reporting enabled, default workflow permissions read with PR approval off
## [2026-09-25] update | Stage 0: correction to the plan's PR review: the CVE-2021-44906 quoted in PR #9 is json5's own changelog line about minimist (json5 2.2.1), not what json5 1.0.2 fixed; the closing comment names the json5 prototype pollution fix instead
## [2026-09-25] handoff | interim: Stage 0 done, Stage 1 started on local branch v3
