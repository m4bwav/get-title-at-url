---
title: GitHub wiki written and published for 3.0.0
kind: note
date: 2026-09-28
verified: 2026-09-29
stale_after: 2027-03-28
tags: [wiki, docs, 3.0.0, github, wikiwright, node-20, windows-1252, undici, proxy]
summary: "the nine wiki pages, where their git working copy is, how every example was verified against the published 3.0.0 on Node 24 and Node 20 (the script beside this note), the 2026-09-29 windows-1252 recipe fix (TextDecoder is latin1 on Node 20.20.2 and 24.13.0; TextDecoderStream is right on all four lines run), the third update (the proxy recipe broken by undici 8, now fetch from undici; the decoder claim scoped to the one-shot decode on 20.18.3+, 22.13.0 to 22.22.0 and 24.0.0 to 24.13.0), the facts the README lacks, five inaccuracies in the shipped README and CHANGELOG, and how to update the wiki at the next release; read before touching the wiki, the README's NOT_HTML row or site-name paragraph, or the CHANGELOG's exit-code line"
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
2. Re-verify: copy `2026-09-28-wiki-verify.mjs` to a scratch folder outside the repository, set `VERSION` in it, `npm init -y`, `npm install get-title-at-url@<new> typescript@6 undici undici7@npm:undici@7` (undici unpinned, at its current latest: the proxy recipe depends on it, see "third update" below), then run it with `V2=<folder>` and `V1=<folder>` pointing at scratch folders holding `get-title-at-url@2.0.0` and `@1.1.8` (without them the Versions page's old-major outputs are missing), and save its stdout as `out.txt`. Run it again on the oldest Node line in `engines` (20 for 3.x) and compare with `2026-09-28-wiki-verify.node20.out.txt` (how: "Updated 2026-09-29" below). Outputs name the fixture as `http://127.0.0.1:<port>`; the pages show it as `https://example.com/` (Home says so).
3. Compare mechanically, not by eye: `python <wikiwright>/scripts/wikiwright.py outputs <wiki dir> out.txt` lists every output block and `//=>` value on a page that the run did not print (it maps the fixture address to `https://example.com` and ignores the port). Then diff `out.txt` with `2026-09-28-wiki-verify.out.txt` beside this note, after replacing `127.0.0.1:<digits>` with `127.0.0.1:<port>`: every difference is a behaviour change to put on the pages. Save the new output over it with the ports replaced.
4. `python <wikiwright>/scripts/wikiwright.py check <wiki dir> --version <new>` and the everwrite checker.
5. Commit, `git push`, `wikiwright.py live m4bwav/get-title-at-url <wiki dir>`.

**Rehearsed 2026-09-28** (wikiwright 0.2.0, update mode against the unchanged 3.0.0): the saved script ran clean (112 cases, 3.0.0, 2.0.0 and 1.1.8), and every value on the pages matched a value it printed. It did not reproduce five page outputs verbatim, all presentation: Recipes' concurrency output in `console.log` form (the script printed JSON), the retry result (printed inside a wrapper), the test double's `//=>` line (written as a JS literal; Node prints `{ title: 'Shop', ... }` with spaces), the default headers as request lines (the fixture echoes them into a title), and npm's install output on Getting started (never from the script, and it has a timing). The script now prints the first four as the pages show them; the Recipes line was changed to Node's form and the npm block carries `<!-- outputs: skip -->` (wiki commit `2807e56`). The output is saved as `2026-09-28-wiki-verify.out.txt`. `wikiwright.py outputs`: 30 checked, 0 missing, 1 skipped. Before this, step 2 said "compare with the pages" with no saved output to diff against and no check that would notice a page output the script never printed. Pages that name the version: Home (last line), API reference (the default User-Agent), Commands (`--version` output), Versions and upgrading (table, download counts, support line), FAQ (User-Agent), Development (the install line in the last section), the footer. Getting started names none.

## Updated 2026-09-29: the windows-1252 recipe, and the Node 20 run

The first real update-mode run (wikiwright L-106 `oldest-node-run`), still against 3.0.0. Wiki commit `fdca908` (`2807e56..fdca908`).

**What was wrong.** Recipes, "Keep the whole title", told readers to "decode the bytes with the right `TextDecoder` first" for legacy encodings. For windows-1252 that is wrong on some Node lines: the script's case `behaviour: windows-1252 header, clean false` (which did exactly that) printed `“Curly” quotes – and € 5` on Node 24.18.0 but the C1 controls U+0093, U+0094, U+0096 and U+0080 in place of the quotes, dash and euro sign on Node 20.20.2 (engines says `>=20`).

**What decodes windows-1252 correctly, 2026-09-29, Windows 11.** On Node 20.20.2 and 24.13.0, `new TextDecoder('windows-1252').decode(bytes)` equals `Buffer.from(bytes).toString('latin1')` (so it really is latin1 there; the labels `cp1252`, `latin1`, `iso-8859-1`, `us-ascii` and `ascii` do the same, from a side probe). `TextDecoderStream('windows-1252')` and `decoder.decode(bytes, {stream: true})` gave the right text on all four lines run: 20.20.2, 22.23.3, 24.13.0 and 24.18.0 (the Latin-1 fast path only serves the one-shot `decode`). 22.23.3 and 24.18.0 decode correctly either way, as the v4 research note's fix range (22.22.1, 24.13.1) predicts. `getTitleAtUrl` returned `“Curly” quotes` on all four.

**Page changes.** Recipes now shows the `TextDecoderStream` loop with its `//=>` output, says which Node versions printed it, and warns that the one-shot decode gave the four control characters on 20.20.2 and 24.13.0. How titles are found links to that recipe (one sentence). Footer date 2026-09-29.

**Script changes** (`2026-09-28-wiki-verify.mjs`). It now changes to its own folder (`process.chdir`), so it runs as `node <scratch>/wiki-verify.mjs` with no `cd`. The case `behaviour: windows-1252 header, clean false` is replaced by `recipes: keep the whole title, windows-1252` (the page's code, printed with `util.inspect` as the `//=>` line shows it) and `recipes: windows-1252, TextDecoder.decode compared` (the one-shot decode with C1 controls shown as `<U+XXXX>`, whether it equals `Buffer` latin1, and the `{stream: true}` decode).

**Runs** (`get-title-at-url@3.0.0`, 2.0.0 and 1.1.8 from npm in scratch folders, npm 11.16.0):

- Before the fix, unchanged script: Node 24.18.0 `diffout` against the saved output 115 sections, 115 same; Node 20.20.2 113 same, 2 changed (`installed`, and the windows-1252 clean false case with the C1 controls).
- After the fix, against the old saved output: Node 24.18.0 113 same, 1 changed (`requests the fixture server saw` 84 to 85), 2 added, 1 removed. Node 20.20.2, 24.13.0 and 22.23.3: the same plus `installed`; the compared case printed `<U+0093>Curly<U+0094> quotes <U+0096> and <U+0080> 5` and `same as Buffer latin1: true` on 20.20.2 and 24.13.0, the right text and `false` on 22.23.3 and 24.18.0.
- Node 20.20.2 against the new saved Node 24.18.0 output: 116 sections, 114 same, 2 changed (`installed` and the compared case). Nothing else in the package, the CLI, the TypeScript case or the bash loop differs on Node 20.
- Saved: `2026-09-28-wiki-verify.out.txt` (Node 24.18.0, replaced) and `2026-09-28-wiki-verify.node20.out.txt` (Node 20.20.2), both through `wikiwright.py diffout --save` (ports as `<port>`). 24.13.0 and 22.23.3 were run but not saved.
- `wikiwright.py outputs` with either saved output: 34 checked, 0 missing, 1 skipped. `check --version 3.0.0`: 0 errors, 0 warnings. `live`: 9 pages, 0 failures, sidebar and footer rendered. Everwrite: 0 strong, 11 weak (one new: a 38-word sentence in the Recipes warning, kept).

**How to run another Node line** (Git Bash): `npx -y -p node@20 node -p process.execPath` downloads it, but its `bin` folder also holds a text file named `node` ("This file intentionally left blank"), and Git Bash then skips the folder, so putting it first on PATH silently runs the system Node. Copy `node.exe` alone into a scratch folder and put that folder first on PATH; the script's `installed` line shows which Node ran. `wikiwright.py diffout` crashes printing C1 controls on a cp1252 console (`UnicodeEncodeError`); set `PYTHONIOENCODING=utf-8`.

## Updated 2026-09-29 (third update)

Update mode again for the unchanged 3.0.0, fixing two wrong claims (wikiwright L-106 `oldest-node-run`, L-131 `recipe-deps-drift`). Wiki commit `1e449b2` (`fdca908..1e449b2`).

**How titles are found.** The page said Node's `TextDecoder` is wrong for windows-1252 "on Node 20 and some Node 22 and 24 releases". Too broad twice over: Node 20.0 to 20.18.2 decode correctly (the Latin-1 fast path, nodejs/node PR 55275, arrived in 20.18.3, 22.13.0 and 23.4.0, per Node's CHANGELOG_V20.md, checked today), and only the one-shot `decode()` is affected (the saved Node 20.20.2 output: one-shot decode gives C1 controls and equals Buffer latin1, `decode(bytes, {stream: true})` gives the right text). The paragraph now names the range, links issue 56542 ("TextDecoder incorrectly decodes 0x92 and several other characters for Windows-1252", closed 2025-12-04) and PR 60893 ("src: implement Windows-1252 encoding support...", merged 2025-12-04, in 22.22.1, 24.13.1, 25.4.0), both checked with `gh api`. Wording carried from the eval draft in `ww7/suite/action-3-r1`, with "earlier releases decode correctly" added.

**Recipes, "Through a proxy or with a custom agent".** The recipe (undici's `ProxyAgent` passed to Node's built-in `fetch`, marked "not tested") failed once run: `npm install undici` now gives 8.11.2, and with Node's `fetch` every call returned `NETWORK_ERROR` `Request failed: fetch failed (invalid onRequestStart method)` on Node 22.23.3 and 24.18.0 (Node's own undici 6.28.1 and 7.28.0). undici 8 (engines `>=22.19.0`) does not import on Node 20.20.2: `TypeError: webidl.util.markAsUncloneable is not a function`. The page now imports `fetch` and `ProxyAgent` from undici, shows the `//=>` result, scopes the block `<!-- outputs: node>=22 -->`, tells Node 20 users to install `undici@7`, warns against the old form, and says `https:` through a proxy was not tested. Footer date was already 2026-09-29.

**Script changes.** A new section "Recipes: through a proxy": a local forward proxy (absolute-form requests and CONNECT; it refuses any target but the fixture server, so nothing leaves 127.0.0.1), then for `undici` (latest) and `undici7` (`npm:undici@7`): the page's form and the old form, printed on one line with `util.inspect(..., {breakLength: Infinity})`, with what the proxy saw. A line `recipes: proxy, undici versions` prints both undici versions and `process.versions.undici`.

**Runs** (scratch `C:\Users\m4bwa\AppData\Local\Temp\ww8\gt`, `get-title-at-url@3.0.0`, typescript 6.0.3, undici 8.11.2, undici7 7.30.0, 2.0.0 and 1.1.8 in their own folders, npm 11.16.0; Node 20.20.2 and 22.23.3 `node.exe` from `npx -p node@<major>` copied alone and put first on PATH):

- `diffout` against the saved outputs: Node 24.18.0 121 sections, 115 same, 1 changed (`requests the fixture server saw` 85 to 88), 5 added (the proxy cases); Node 20.20.2 the same shape (85 to 87; both undici 8 cases threw).
- Node 22.23.3 against the new Node 24.18.0 output: 119 of 121 same (`installed`, Node's own undici version); not saved.
- Page form: 24.18.0 and 22.23.3 with undici 8.11.2 `{ title: 'Example Domain', ... status: 200 }`, proxy saw `GET http://<fixture>/`; undici 7.30.0 the same on all three lines, proxy saw `CONNECT <fixture>`. Old form: undici 8 `NETWORK_ERROR` on 22 and 24; undici 7 works on 20, 22 and 24.
- Saved both outputs through `diffout --save`. `outputs` with both: 35 checked, 0 missing, 1 skipped. `check --version 3.0.0`: 0 errors, 0 warnings. `live`: 9 pages, 0 failures, sidebar and footer rendered; the new text is on the live pages. Everwrite: 0 strong, 10 weak (two new long sentences were split).

## How the examples were verified

Scratch project in the session scratchpad: `npm install get-title-at-url@3.0.0 typescript@6` (npm 11.16, Node 24.18.0, Windows 11). The script imports the package both ways, runs the published bin with `node` (asynchronously: `spawnSync` would block the in-process fixture server), compiles a TypeScript narrowing example with `tsc --strict --module nodenext`, runs a bash loop over the bin, and runs 2.0.0 and 1.1.8 from their own scratch installs. `npx get-title-at-url --version` printed `3.0.0`; an empty project's `npm install get-title-at-url@3.0.0` printed "added 1 package". The repository's own `npm test` passed 186 of 186.

Not run: pnpm, yarn, Bun and Deno (not installed here; the pages say so and point at verify-published, which runs Bun and Deno), browsers and edge runtimes, the server-side address-check pattern. (The undici `ProxyAgent` recipe has run since the third update of 2026-09-29, for an `http:` page only.)

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
5. CHANGELOG, 3.0.0 Added (found 2026-09-29): "(Node 20's own decoder gets them wrong)". Too broad: Node 20.0 to 20.18.2 decode windows-1252 correctly, the bug is in 20.18.3 and later 20.x, 22.13.0 to 22.22.0 and 24.0.0 to 24.13.0, and only the one-shot `decode()` is affected. Suggested: "(Node's own one-shot decoder gets them wrong on 20.18.3 and later 20.x, 22.13 to 22.22 and 24.0 to 24.13)".

Worth adding at the next README change (omissions, not errors): the spaced-dash cut, the `instanceof` hazard across builds, and that 2.0.0 no longer imports. Recommended to Mark, his call: deprecate 2.0.0 on npm (it still gets about 60 downloads a week and throws on import), for example `npm deprecate get-title-at-url@2.0.0 "2.0.0 fails to import since cheerio 1.0.0 (2024); use 3.x"`.

## Gotchas

- `spawnSync` of the CLI from the same process that runs the fixture server deadlocks the server; spawn asynchronously.
- The verification script printed arrays as JSON; the Recipes page shows `console.log` output, which Node breaks over lines differently. Print in the form the page shows.
- A Python string in a Bash heredoc turned `\n` into a real newline inside the generated JavaScript (wikiwright L-001).
- The xo config ignores `ai-docs/**`, so the verification script does not affect `npm run lint`.

Related: see also [../HANDOFF.md](../HANDOFF.md), [../log.md](../log.md); the sibling wiki notes of 2026-09-28 in the m4bwav/DotNetJsonPrettyPrinter and m4bwav/DotNetRandomNameGenerator repositories (ai-docs, notes folder).
