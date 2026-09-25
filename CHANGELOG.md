# Changelog

All notable changes to this package. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the package uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - Unreleased

A rewrite in TypeScript with no runtime dependencies, published as both ES module and CommonJS, with types for each.

### Added

- TypeScript declarations for both formats (`dist/index.d.mts` and `dist/index.d.cts`).
- A CommonJS build: `require('get-title-at-url')` works on every supported Node version, not only where Node can `require()` an ES module.
- `extractTitle(html, options?)`: the title of HTML you already have. Pure and synchronous, so it runs anywhere: browsers, Deno, Bun, edge functions.
- A named export `getTitleAtUrl` beside the default export, and the `GetTitleError` class.
- `url` (the final URL after redirects) and `status` (the HTTP status) in every result.
- Options: `timeout` (default 10 seconds), `signal`, `headers`, `fetch` and `maxBytes` (default 1 MiB).
- `og:title` and `twitter:title` as fallbacks when a page has no `<title>`, and `og:site_name` to remove exactly the site's own name from a title, whether it comes first or last.
- Character encoding detection in the order browsers use (byte order mark, the `Content-Type` charset, `<meta charset>` or `http-equiv`, then UTF-8), so pages in ISO-8859-1, windows-1252, GBK, Shift_JIS and other encodings come out right. windows-1252, which is also what HTML means by latin1, iso-8859-1 and us-ascii, is decoded by the package itself, so curly quotes, dashes and the euro sign come out the same on every runtime (Node 20's own decoder gets them wrong).
- CLI: `--json`, `--timeout <ms>` and `--version`; exit codes 0 (title printed), 1 (no title) and 2 (bad usage).

### Changed

- **Breaking:** Node 20 or newer.
- **Breaking:** the result no longer carries `response` and `body`. It is `{title, url, status}` on success and `{error, url, status?}` on failure, so `const {title, error} = await getTitleAtUrl(url)` works as before.
- **Breaking:** `error` is always a `GetTitleError` with a `code` (`INVALID_URL`, `HTTP_ERROR`, `NETWORK_ERROR`, `TIMEOUT`, `NOT_HTML` or `NO_TITLE`); 2.0.0 returned the string `'Unexpected response'` or an AxiosError.
- **Breaking:** an invalid URL resolves with `error.code === 'INVALID_URL'` instead of throwing. The promise never rejects.
- **Breaking:** the title comes from the page's `<title>` element; 2.0.0 (through article-title) sometimes returned the page's first heading instead.
- A site name is removed only at a separator with a space on each side (` | `, ` - `, ` – `, ` — `, ` · `, ` » `, ` :: `), so hyphenated titles such as "Node-API docs" stay whole.
- A response that is not HTML is rejected with `NOT_HTML` instead of being searched for a title, and at most `maxBytes` of a page is read.
- The CLI prints errors on stderr and exits non-zero; 2.0.0 printed them on stdout, exited 0, and showed a stack trace when no URL was given.

### Removed

- Every runtime dependency: axios, article-title (and cheerio with it), is-url and meow. Installing the package adds one package and prints no warnings ([#6](https://github.com/m4bwav/get-title-at-url/issues/6)).
- The Travis CI, Snyk, Coveralls and Codecov configuration.

## [2.0.0] - 2022-11-29

### Changed

- **Breaking:** ES module only, and a promise instead of a callback: `const {title, error} = await getTitleAtUrl(url)`.
- request, which was deprecated, replaced by axios; article-title 4 and meow 11.

## 1.0.0 to 1.1.8 - 2016-05-06 to 2019-11-25

The 1.x line: CommonJS, `getTitleAtUrl(url, callback)` with the callback called as `(title, error)`, built on request, article-title, is-url and meow 3.

- 1.1.5 to 1.1.8 (2017-08-18 to 2019-11-25): dependency updates (article-title 2, request 2.88) and README fixes.
- 1.1.0 to 1.1.4 (2017-04-23): dependency updates and fixed handling of 404 pages.
- 1.0.0 to 1.0.27 (2016-05-06 to 2016-09-18): the first release, URL validation with is-url, tests, and dependency updates.

[3.0.0]: https://github.com/m4bwav/get-title-at-url/compare/v2.0.0...v3.0.0
[2.0.0]: https://github.com/m4bwav/get-title-at-url/compare/v1.1.8...v2.0.0
