# Handoff

Updated 2026-09-24 (planning session: inventory, research, decisions, the v3 plan; no code changed). Read this first, then [log.md](log.md).

## Current state

- Published: 2.0.0 on npm (2022-11-29). It still works on Node 24.18: `node cli.js https://example.com/` prints `Example Domain`, the four live-network ava tests pass, `xo` is clean. Nothing in the code has been changed.
- Repository cloned to `D:\m4bwa\Claude\Projects\Ai\get-title-at-url` (master, clean apart from the new files below). Everlast doc set registered in mode repo with sync push. New, uncommitted: `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, `ai-docs/`.
- The plan: [plans/2026-09-25-modernization-and-v3-release.md](plans/2026-09-25-modernization-and-v3-release.md). It holds the inventory (82 Dependabot alerts, 11 bot PRs, 3 dead webhooks, no CI, no releases), the target state, decisions D1 to D16 with recommendations, the proposed v3 API, build and package specifics, Stages 0 to 4 with absolute dates, the nine-layer test strategy and its artifact-by-environment matrix, the review of every open PR and issue, a verification checklist, risks, and the exact Stage 0 commands.
- Why the plan looks the way it does: [decisions/2026-09-24-v3-shape-typescript-dual-build-zero-deps.md](decisions/2026-09-24-v3-shape-typescript-dual-build-zero-deps.md). Facts with sources and dates: [notes/2026-09-24-node-npm-ecosystem-september-2026.md](notes/2026-09-24-node-npm-ecosystem-september-2026.md) and [notes/2026-09-24-typescript-library-packaging-september-2026.md](notes/2026-09-24-typescript-library-packaging-september-2026.md).

## In progress

- Nothing in code. Stage 0 (close the bot PRs, delete the stale branches and webhooks, repo settings) is ready to run from the plan's appendix; it waits only for Mark to read the decisions table.

## Decisions made this session

- TypeScript source built by tsdown into ESM + CJS + types; zero runtime dependencies (native fetch, own title extractor); `{title, error}` result kept and typed; Node floor 20 with a 20/22/24/26 matrix; `node:test` + c8 with consumer fixtures per artifact and Bun/Deno jobs; staged npm trusted publishing from GitHub Actions; Travis/Snyk/Coveralls/Codecov removed; the eleven bot PRs closed rather than merged (they only touch the repo lockfile). All in the decision entry with the alternatives rejected.

## Dead ends hit

- `gh api user/installations` returns 403 with the CLI's OAuth token, so whether the Snyk GitHub App is installed cannot be checked from here; the plan makes the uninstall Mark's browser task.
- The everlast privacy lint reads npm scope names (the arethetypeswrong and tsconfig scopes) as personal handles, the GitHub Actions id-token permission line as a credential, and some judgement verbs about a past reply as opinions about people; phrase them differently inside `ai-docs/` (write `attw`, "the tsconfig node20 base package", "id-token set to write", "attributed the warnings to").
- The lint also reads a backticked path with a slash as dead when the file does not exist yet (planned files are therefore written without code formatting in the plan) and a TypeScript generic such as `Promise<GetTitleResult>` as leftover template text; the one remaining lint finding on the plan is that false positive.
- Running the old test suite needs the 2022 lockfile: `npm ci --ignore-scripts` (766 packages, ten deprecation warnings) works; a plain `npm install` would rewrite the lockfile.

## Next single action

Mark reads the decisions table in the plan and says what to change (silence keeps the recommendations); then the agent runs the Stage 0 appendix commands and starts Stage 1 on branch `v3`.
