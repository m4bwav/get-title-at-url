# AGENTS.md

Rules for any AI agent (Claude Code, Copilot, Cursor, Codex) working in this repository. `CLAUDE.md` and `.github/copilot-instructions.md` only point here.

## What this is

The npm package `get-title-at-url`: fetch a web page and return its title, as a library and as a CLI. On npm since 2016; 2.0.0 (2022-11-29, plain ESM JavaScript on axios and article-title) is the published version until 3.0.0 ships. Version 3 is TypeScript in `src/`, built by tsdown into ESM and CommonJS with a declaration file for each, with no runtime dependencies (native `fetch` in the library, `node:util` `parseArgs` in the CLI). The plan, with the 3.0.0 release through npm trusted publishing still to come, is `ai-docs/plans/2026-09-25-modernization-and-v3-release.md`; start with `ai-docs/HANDOFF.md` to see how far it has got.

## Rules

- **Availability is the product.** The package must stay usable from `import` and `require`, ship types for both, support every Node line in `engines` (20 and up until v4), and keep the library free of Node-only APIs so it runs on Bun, Deno, edge runtimes and browsers. Only the CLI entry may use Node-specific modules. Do not add a runtime dependency to the library without a decision entry in `ai-docs/decisions/`.
- **Tests cover every artifact, not just the code.** The plan's test strategy is the contract: unit, functional against the local fixture server, CLI, package shape (`publint`, `@arethetypeswrong/cli`), consumer fixtures for ESM, CJS, the type files and the bin, Bun and Deno, and post-publish verification from the registry. A behaviour change lands with its test. `npm test` never touches the live internet; live checks are the opt-in `npm run test:live`.
- **Releases follow one ritual.** Update `CHANGELOG.md` (a release's heading carries its date; `release.yml` refuses "Unreleased"), run `npm version <major|minor|patch>`, `git push --follow-tags`. The `release.yml` workflow builds, tests, stages the npm publish through trusted publishing and creates the GitHub Release; Mark approves the staged version on npmjs.com; then run the `verify-published` workflow with the version. Never publish from a laptop with a token once trusted publishing is configured.
- **Dependencies.** Dependabot opens weekly PRs (npm and GitHub Actions). Merge when CI is green; majors get a look at the release notes first. Actions are pinned to commit SHAs with the version in a comment; keep it that way.
- **Research beats recall.** Node, npm and tool versions change; the notes under `ai-docs/notes/` carry the date each fact was verified. Re-verify any version number older than three months before relying on it.
- **Document for handoff.** Anything learned, decided or built goes into `ai-docs/` (at minimum a line in `ai-docs/log.md`) before you finish; rewrite `ai-docs/HANDOFF.md` when work is left unfinished. A fresh session in any tool must be able to continue from disk alone.
- **No AI attribution anywhere**: no Co-Authored-By trailers, no "generated with" lines in commits, PRs or files.
- **Windows note.** The repository is LF (`.gitattributes`); after batch-writing files on Windows, check line endings by counting byte 13 with node (Git Bash's grep cannot see carriage returns) and normalise before committing.

## Commands

```bash
npm ci
npm run build          # tsdown -> dist/ (index.mjs, index.cjs, index.d.mts, index.d.cts, cli.mjs, maps)
npm test               # build, then node --test: unit, functional (local fixture server), CLI, package shape
npm run test:dist      # the same suites against the dist/ already built, without building
npm run test:consumers # build, pack, install the tarball into a scratch project, run the ESM, CJS, type and bin fixtures
                       # CONSUMER_RUNTIMES=bun,deno adds Bun and Deno; CONSUMER_PACKAGE=get-title-at-url@<version> installs from npm instead
npm run coverage       # c8 over the same suites, mapped back to src/; fails under 95% lines or 90% branches
npm run lint           # xo (config and every rule override, with its reason, in xo.config.js)
npm run typecheck      # tsc --noEmit
npm run check          # publint, attw --pack ., npm pack --dry-run
npm run test:live      # opt-in live smoke against example.com, google.com, yahoo.com
node dist/cli.mjs https://example.com/   # prints "Example Domain"
```

tsdown needs Node 22.18+ or 24 to build; the built output and the tests run on Node 20 and up.

## Layout and traps

- `src/index.ts` fetches and decodes; `src/extract-title.ts` is the pure HTML-to-title function (no imports); `src/errors.ts` holds `GetTitleError`; `src/cli.ts` is the only file allowed Node APIs. The shape test fails the build if `node:`, `process`, `Buffer` or `require(` appear in the library output.
- Tests import `dist/`, never `src/`, and run each suite against both builds (`test/helpers/builds.js`). The fixture server (`test/helpers/fixture-server.js`) has one route per behaviour; add a route rather than calling a real site.
- The npm scripts name every test file. Plain `node --test` would also pick up the helpers and the consumer fixtures under `test/`, which are not tests.
- Node 20's `TextDecoder` decodes windows-1252 (and latin1, iso-8859-1, us-ascii) bytes 0x80 to 0x9F as C1 controls, so the library decodes that encoding family itself. Do not hand it back to `TextDecoder`.
- `package.json` `main`, `module`, `types` and `exports` are rewritten by tsdown on every build (`exports: true`); edit them in `tsdown.config.ts`, not by hand. `dist/cli.mjs.map` is built (coverage needs it) but kept out of the tarball by `files`.
- CI (`.github/workflows/ci.yml`) installs and builds on Node 24 in every job, then switches to the job's Node line and runs `npm run test:dist` and the consumer fixtures, because tsdown cannot run on Node 20. The ruleset on `master` requires only the final `ci` job, which passes when every other job passed, so jobs can change without touching the ruleset.
- The npm trusted publisher names `release.yml`: renaming the file breaks publishing. Its `publish` job, the only one with `id-token` and `contents` write, stages the tarball the `build` job tested and runs no dependency code.

## everlast (session knowledge, load on demand)

- `ai-docs/INDEX.md` lists what past sessions learned here (solutions with verified commands, decisions with reasons, plans). At the start of a task, scan it and open only the entries whose title or tags match; no line matches: `everlast.py search "<key terms>"` before concluding nothing was recorded. Read `ai-docs/HANDOFF.md` when continuing unfinished work (everlast-resume skill).
- Before acting on an entry marked `(recheck due)`, run `everlast.py recheck <entry>`, re-run its Verified-by command only when that is read-only or safe (a build, a test, a version query), then record `everlast.py verify <entry>` or `verify <entry> --failed "what broke"`; a fix that changed is superseded, never reused blindly.
- Before finishing a task that hit a dead end, verified a non-obvious command, made a design choice, or taught you something about the user, record it (everlast-capture skill, or `everlast.py note` / `handoff`); rewrite `HANDOFF.md` when work is left unfinished. Say "nothing to record" when that is true.
- Anything naming a person, an internal host or name, a credential, or an opinion about people goes to the private sidecar (`--private`), never here. Lessons about the user or this machine go to the user tier (`--user`).
- Rules go in this file, system layout in CODEMAP.md; the doc set holds only what could not be re-derived from the code in a minute.
- Link documents together with relative markdown links: every markdown folder is reachable from an index whose lines say when to read each file (`ai-docs/INDEX.md` is generated from frontmatter; give entries a one-line `summary`), and an entry links the entries it relates to on a typed `Related:` line (`supersedes`, `contradicts`, `builds on`, `see also`). The set then reads as a graph for people in Obsidian and for agents alike. No wikilinks in the repo.
