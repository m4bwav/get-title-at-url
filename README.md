# get-title-at-url

[![npm version](https://img.shields.io/npm/v/get-title-at-url)](https://www.npmjs.com/package/get-title-at-url)
[![CI](https://github.com/m4bwav/get-title-at-url/actions/workflows/ci.yml/badge.svg)](https://github.com/m4bwav/get-title-at-url/actions/workflows/ci.yml)
[![npm downloads](https://img.shields.io/npm/dm/get-title-at-url)](https://www.npmjs.com/package/get-title-at-url)

Get the title of the web page at a URL, from code or from the command line.

- No dependencies: it uses the platform's own `fetch`.
- ES module and CommonJS builds, with TypeScript types for both.
- Node 20 and newer, Bun, Deno and edge runtimes; `extractTitle` runs in browsers too.
- Never throws: a failure comes back as an error with a code you can check.

## Install

```sh
npm install get-title-at-url
```

## Usage

### ES modules

```js
import getTitleAtUrl from 'get-title-at-url';

const {title, error} = await getTitleAtUrl('https://example.com/');
console.log(title ?? error.message);
//=> 'Example Domain'
```

### CommonJS

```js
const {getTitleAtUrl} = require('get-title-at-url');

getTitleAtUrl('https://example.com/').then(({title}) => {
  console.log(title);
});
```

`require()` returns an object with `getTitleAtUrl`, `default` (the same function), `extractTitle` and `GetTitleError`.

### TypeScript

The types ship with the package. The result narrows on `error`:

```ts
import getTitleAtUrl from 'get-title-at-url';

const result = await getTitleAtUrl('https://example.com/');
if (result.error) {
  console.error(result.error.code, result.error.message);
} else {
  console.log(result.title, result.status);
}
```

### Deno

```ts
import getTitleAtUrl from 'npm:get-title-at-url';

const {title} = await getTitleAtUrl('https://example.com/');
```

Run it with `--allow-net`.

### Bun

```sh
bun add get-title-at-url
```

Then import it as in the ES module example.

### Browsers and edge runtimes

`getTitleAtUrl` needs nothing but `fetch`, so Cloudflare Workers, Deno Deploy and Vercel or Netlify edge functions can call it directly.

A web page in a browser is different: it can only read another site's HTML when that site allows it through CORS headers, and most sites do not. There, fetch the page through your own server and hand the HTML to `extractTitle`, which works on any HTML you already have:

```js
import {extractTitle} from 'get-title-at-url';

const response = await fetch(`/api/page?url=${encodeURIComponent(pageUrl)}`);
console.log(extractTitle(await response.text()));
```

## API

### getTitleAtUrl(url, options?)

Fetches the page and resolves to its title. The promise never rejects.

`url` is a `string` or a `URL`: an absolute `http:` or `https:` URL.

It resolves to one of:

| Outcome | Result |
|---|---|
| Success | `{title, url, status}`: the title, the final URL after redirects, and the HTTP status |
| Failure | `{error, url, status?}`: a `GetTitleError`, the URL, and the HTTP status when a response arrived |

#### Options

| Option | Type | Default | What it does |
|---|---|---|---|
| `timeout` | `number` | `10000` | Milliseconds before the request is aborted with `TIMEOUT` |
| `signal` | `AbortSignal` | none | Abort the request yourself; combined with `timeout` |
| `headers` | `Record<string, string>` | none | Extra request headers, merged over the defaults (`User-Agent: get-title-at-url/<version> (+https://github.com/m4bwav/get-title-at-url)` and an HTML `Accept`) |
| `fetch` | `typeof fetch` | the global `fetch` | Another fetch: a proxy, a custom agent, a test double |
| `maxBytes` | `number` | `1048576` (1 MiB) | Stop reading the page after this many bytes; the title sits in `<head>` |

#### Errors

`error` is a `GetTitleError`, a subclass of `Error`, with a `code`, a `message`, and when known the `status`, the `url` and the underlying `cause`.

| `error.code` | When |
|---|---|
| `INVALID_URL` | The input is not an absolute `http:` or `https:` URL |
| `HTTP_ERROR` | The response status is outside 200 to 299 (see `status`) |
| `NETWORK_ERROR` | No response arrived: DNS, a refused connection, TLS, too many redirects, or no `fetch` in the runtime |
| `TIMEOUT` | The `timeout` ran out, or your `signal` aborted the request |
| `NOT_HTML` | The response is not `text/html` or `application/xhtml+xml` |
| `NO_TITLE` | The page has no title |

### extractTitle(html, options?)

Returns the title of an HTML string, or `undefined` when there is none. Synchronous, with no network and no DOM, so it runs anywhere.

```js
import {extractTitle} from 'get-title-at-url';

extractTitle('<title>Getting started | Acme Docs</title>');
//=> 'Getting started'

extractTitle('<title>Getting started | Acme Docs</title>', {clean: false});
//=> 'Getting started | Acme Docs'
```

### How the title is chosen

1. The first `<title>` element, skipping any inside comments, scripts, styles, templates or inline SVG.
2. Without one, `<meta property="og:title">`, then `<meta name="twitter:title">`.
3. Character references are decoded (`&amp;` becomes `&`) and whitespace collapsed, as a browser does.
4. The site name comes off. When the page declares `og:site_name`, exactly that name is removed from the start or the end, so "Post | Acme" becomes "Post". Otherwise the title is split at separators with a space on each side (` | `, ` - `, ` – `, ` — `, ` · `, ` » `, ` :: `) and the first part is kept if it has at least four characters. Hyphenated words are never split: "Node-API docs" stays whole. `{clean: false}` skips this step.

Pages in other encodings are decoded using, in order, the byte order mark, the charset in `Content-Type`, a `<meta charset>` in the first 1024 bytes, and finally UTF-8.

## CLI

```sh
npx get-title-at-url https://example.com/
```

Or install it once with `npm install --global get-title-at-url`.

```text
Usage
  $ get-title-at-url <url> [--timeout <ms>] [--json]

Options
  --timeout <ms>  Give up after this many milliseconds (default 10000)
  --json          Print the whole result as JSON, even on failure
  --help, -h      Show this help
  --version, -v   Show the version
```

It prints the title and exits `0`. When it cannot get one it prints `error: <message>` on stderr and exits `1`; bad usage exits `2`. With `--json` it prints the whole result on stdout:

```json
{
  "title": "Example Domain",
  "url": "https://example.com/",
  "status": 200
}
```

## Migrating from 2.x

- Node 20 or newer is required.
- `const {title, error} = await getTitleAtUrl(url)` works as before.
- The result no longer has `response` and `body`; it has `url` (after redirects) and `status` instead.
- `error` is always a `GetTitleError`: check `error.code`.
- An invalid URL resolves with `error.code === 'INVALID_URL'` instead of throwing.
- The title comes from `<title>`, then `og:title`; 2.x sometimes returned the page's first heading instead.
- CommonJS works again: `const {getTitleAtUrl} = require('get-title-at-url')`.

Everything that changed is in the [changelog](CHANGELOG.md).

## License

MIT © [Mark Rogers](https://www.markdavidrogers.com)
