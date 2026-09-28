---
title: GitHub wiki written and published for 3.0.0
kind: note
date: 2026-09-28
verified: 2026-09-28
stale_after: 2027-03-28
tags: [wiki, docs, 3.0.0, github, wikiwright]
summary: "the nine wiki pages, where their git working copy is, how every example was verified against the published 3.0.0 (the script beside this note), the facts the README lacks, four inaccuracies in the shipped README and CHANGELOG, and how to update the wiki at the next release; read before touching the wiki, the README's NOT_HTML row or site-name paragraph, or the CHANGELOG's exit-code line"
---

# GitHub wiki for 3.0.0

## Summary

Mark asked for the repository wiki (https://github.com/m4bwav/get-title-at-url/wiki) as the first run of the new wikiwright skill (m4bwav/wikiwright). Nine pages plus sidebar and footer were written from the 3.0.0 source, README, CHANGELOG, AGENTS.md, the ai-docs plan and HANDOFF, the CI workflows, issues #3 and #6, the pull requests and the npm registry. Every example output on the wiki was produced by `2026-09-28-wiki-verify.mjs` (next to this note) against `get-title-at-url@3.0.0` installed from npm, with a local fixture server; 70 requests, none to the internet. Published on 2026-09-28 as wiki commit `b271157`; `wikiwright.py live` found every page answering and the sidebar and footer rendered. `wikiwright.py check`: 0 errors, 0 warnings. Everwrite checker: 0 strong, 10 weak (long sentences in reference text, two "rather than" with both halves informative).

Pages: Home, Getting started, API reference, Commands, How titles are found, Recipes, Versions and upgrading, FAQ, Development.

## Where the pages are

`D:\m4bwa\Claude\Projects\Ai\get-title-at-url.wiki` (a sibling of this clone, outside this repository), branch `master`, remote `origin` = `https://github.com/m4bwav/get-title-at-url.wiki.git`. Files: `Home.md`, `Getting-Started.md`, `API-Reference.md`, `Commands.md`, `How-Titles-Are-Found.md`, `Recipes.md`, `Versions-and-Upgrading.md`, `FAQ.md`, `Development.md`, `_Sidebar.md`, `_Footer.md`. Plain markdown links between pages (`[Recipes](Recipes)`), no wikilinks, LF line endings.

## How it was published

The wiki feature had been switched on earlier the same day (`gh repo edit --enable-wiki`), and the placeholder repository existed (commit `d652d15`, "Initial Home page"). `wikiwright.py preflight m4bwav/get-title-at-url --enable --clone <wiki dir>` reported `STATE: placeholder`. The pages were committed on top of the cloned placeholder, so the push was a plain fast-forward (`d652d15..b271157`); no force was needed.

## Updating the wiki later

1. `git -C D:\m4bwa\Claude\Projects\Ai\get-title-at-url.wiki pull --ff-only`, then edit the pages.
2. Re-verify: copy `2026-09-28-wiki-verify.mjs` to a scratch folder outside the repository, set `VERSION` in it, `npm init -y`, `npm install get-title-at-url@<new> typescript@6`, `node wiki-verify.mjs > out.txt`, and compare with the pages. The old-major cases need `get-title-at-url@2.0.0` and `@1.1.8` installed in two more folders, passed as `V2=` and `V1=`. Outputs name the fixture as `http://127.0.0.1:<port>`; the pages show it as `https://example.com/` (Home says so).
3. `python <wikiwright>/scripts/wikiwright.py check <wiki dir> --version <new>` and the everwrite checker.
4. Commit, `git push`, `wikiwright.py live m4bwav/get-title-at-url <wiki dir>`. Pages that name the version: Home (last line), API reference (the default User-Agent), Commands (`--version` output), Versions and upgrading (table, download counts, support line), FAQ (User-Agent), Development (the install line in the last section), the footer. Getting started names none.

## How the examples were verified

Scratch project in the session scratchpad: `npm install get-title-at-url@3.0.0 typescript@6` (npm 11.16, Node 24.18.0, Windows 11). The script imports the package both ways, runs the published bin with `node` (asynchronously: `spawnSync` would block the in-process fixture server), compiles a TypeScript narrowing example with `tsc --strict --module nodenext`, runs a bash loop over the bin, and runs 2.0.0 and 1.1.8 from their own scratch installs. `npx get-title-at-url --version` printed `3.0.0`; an empty project's `npm install get-title-at-url@3.0.0` printed "added 1 package". The repository's own `npm test` passed 186 of 186.

Not run: pnpm, yarn, Bun and Deno (not installed here; the pages say so and point at verify-published, which runs Bun and Deno), browsers and edge runtimes, the undici `ProxyAgent` recipe, the server-side address-check pattern.

## Facts verified while writing (not in the README)

- The CommonJS and ES module builds each have their own `GetTitleError` class: `require(...).GetTitleError === (await import(...)).GetTitleError` is `false`, so `instanceof` fails across module systems. The wiki says to check `error.code`.
- A response with no `Content-Type` header is read as HTML.
- When `og:site_name` is present but does not match, the separator split still runs: `Pricing — Acme Cloud` with `og:site_name` `Acme` gives `Pricing`. The site-name match ignores case.
- The separator rule cuts real titles with a spaced dash: `Pros – and cons` gives `Pros`; a windows-1252 page titled `“Curly” quotes – and € 5` gives `“Curly” quotes`.
- `<meta name="og:title">` is accepted as well as `property=`; the first of two meta tags with the same key wins; a blank `<title>` falls through to `og:title`; an unclosed `<title>` does not count.
- Unknown named references (`&nosuch;`) and references without a semicolon (`AT&T`) stay as written; `&#150;` is `–`.
- Messages: `Invalid URL "example.com": expected an absolute http: or https: URL`; `HTTP 404 Not Found`; `Request failed: fetch failed (connect ECONNREFUSED 127.0.0.1:<port>)`; `Request failed: fetch failed (redirect count exceeded)`; `Timed out after 200 ms`; `The request was aborted` (also for an already-aborted signal); `Expected an HTML page, got application/json`; `The page has no title`; `There is no fetch in this runtime; pass one as options.fetch`; a custom fetch that throws gives `Request failed: <its message>`; an options getter that throws gives `NETWORK_ERROR` `Request failed: bad getter`.
- An invalid URL longer than 200 characters is cut to 200 plus `…` in `url` and the message.
- `JSON.stringify(result)` keeps the error's `name`, `code`, `message`, `status` and `url` (through `toJSON`), not `cause`.
- `maxBytes` is a hard stop: a 1.3 MB page with its title at the end gives `NO_TITLE` by default.
- CLI: `--timeout=5000` works; `--timeout 0` and non-numbers are exit 2; an unknown flag prints Node's `parseArgs` message, which has an unbalanced quote (`as in '-- "--verbose"`); every usage error prints the help after it on stderr; `--json` failures go to stdout with exit 1.
- 2.0.0 cannot be imported after a fresh install: `SyntaxError: The requested module 'cheerio' does not provide an export named 'default'` (cheerio 1.2.0 resolved on 2026-09-28). No version is deprecated on npm. Downloads in the week to 2026-09-27: 3.0.0 275, 3.0.0-beta.1 144, 2.0.0 63, 1.1.8 14; last month 647, last year 9,521.
- 1.1.8's callback is `(title, error)` with `error === null` on success and `error === 404` (a number) for a 404; `require()` returned the function itself.
- 33 versions on npm; 1.0.3, 1.0.12 to 1.0.16 and 1.1.3 were never published. 3.0.0 tarball: 11 files, 140,555 bytes unpacked, with a provenance attestation.

## Inaccuracies found in the shipped docs (not fixed; README and CHANGELOG ship in the package)

1. README, errors table, `NOT_HTML`: "The response is not `text/html` or `application/xhtml+xml`". A response with no `Content-Type` is not rejected; it is read as HTML. The JSDoc in `src/errors.ts` says the same. Suggested wording: "The response's media type is something other than `text/html` or `application/xhtml+xml` (a missing `Content-Type` is read as HTML)".
2. README, "How the title is chosen", step 4: "When the page declares `og:site_name`, exactly that name is removed ... Otherwise the title is split at separators". The split also runs when `og:site_name` is declared but does not match the title. Add "or the name does not match".
3. CHANGELOG, 3.0.0 Added: "exit codes 0 (title printed), 1 (no title) and 2 (bad usage)". Exit 1 is every failure to get a title (HTTP error, network, timeout, invalid URL, not HTML, no title), as the CLI's own help says ("the page could not be fetched or has no title").
4. README, CLI section: the help text shown is a shortened copy; the real `--help` also has "Exit codes" and "Example" sections and a first line. Minor; either paste the real output or say it is an excerpt.

Worth adding at the next README change (omissions, not errors): the spaced-dash cut, the `instanceof` hazard across builds, and that 2.0.0 no longer imports. Recommended to Mark, his call: deprecate 2.0.0 on npm (it still gets about 60 downloads a week and throws on import), for example `npm deprecate get-title-at-url@2.0.0 "2.0.0 fails to import since cheerio 1.0.0 (2024); use 3.x"`.

## Gotchas

- `spawnSync` of the CLI from the same process that runs the fixture server deadlocks the server; spawn asynchronously.
- The verification script printed arrays as JSON; the Recipes page shows `console.log` output, which Node breaks over lines differently. Print in the form the page shows.
- A Python string in a Bash heredoc turned `\n` into a real newline inside the generated JavaScript (wikiwright L-001).
- The xo config ignores `ai-docs/**`, so the verification script does not affect `npm run lint`.

Related: see also [../HANDOFF.md](../HANDOFF.md), [../log.md](../log.md); the sibling notes `DotNetJsonPrettyPrinter/ai-docs/notes/2026-09-28-github-wiki.md` and `DotNetRandomNameGenerator/ai-docs/notes/2026-09-28-github-wiki.md`.
