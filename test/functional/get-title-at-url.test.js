import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {
  after,
  before,
  describe,
  test,
} from 'node:test';
import {builds, version} from '../helpers/builds.js';
import {ENDLESS_SAFETY_LIMIT, startFixtureServer} from '../helpers/fixture-server.js';

let server;

before(async () => {
  server = await startFixtureServer();
});

after(async () => {
  await server.close();
});

const hasGbk = (() => {
  try {
    return Boolean(new TextDecoder('gbk'));
  } catch {
    return false;
  }
})();

// A port nothing listens on: bind one, then close it.
async function closedPortUrl() {
  const probe = createServer();
  await new Promise(resolve => {
    probe.listen(0, '127.0.0.1', resolve);
  });
  const {port} = probe.address();
  await new Promise(resolve => {
    probe.close(resolve);
  });
  return `http://127.0.0.1:${port}/`;
}

// Run `callback` with a global property replaced, then put it back.
async function withGlobal(object, key, value, callback) {
  const original = object[key];
  object[key] = value;
  try {
    return await callback();
  } finally {
    object[key] = original;
  }
}

for (const {name, lib} of builds) {
  const {getTitleAtUrl, GetTitleError, default: defaultExport} = lib;

  describe(`getTitleAtUrl (${name} build)`, () => {
    describe('success', () => {
      test('returns the title, the final URL and the status; the <title> wins over a different <h1>', async () => {
        assert.deepEqual(await getTitleAtUrl(`${server.url}/ok`), {title: 'Fixture Page', url: `${server.url}/ok`, status: 200});
      });

      test('the default export is the same function', () => {
        assert.equal(defaultExport, getTitleAtUrl);
      });

      test('2.x-style destructuring still works', async () => {
        const ok = await getTitleAtUrl(`${server.url}/ok`);
        assert.equal(ok.title, 'Fixture Page');
        assert.equal(ok.error, undefined);
        const {title, error} = await getTitleAtUrl(`${server.url}/not-found`);
        assert.equal(title, undefined);
        assert.ok(error);
      });

      test('accepts a URL object', async () => {
        const result = await getTitleAtUrl(new URL('/ok', server.url));
        assert.equal(result.title, 'Fixture Page');
      });

      test('strips the og:site_name suffix', async () => {
        assert.equal((await getTitleAtUrl(`${server.url}/site-suffix`)).title, 'Post Title');
      });

      test('falls back to og:title', async () => {
        assert.equal((await getTitleAtUrl(`${server.url}/og-only`)).title, 'Only & Open Graph');
      });

      test('application/xhtml+xml counts as HTML', async () => {
        assert.equal((await getTitleAtUrl(`${server.url}/xhtml`)).title, 'XHTML Page');
      });

      test('a response without a Content-Type is read as HTML', async () => {
        assert.equal((await getTitleAtUrl(`${server.url}/no-content-type`)).title, 'No Content Type');
      });
    });

    describe('encodings', () => {
      test('charset from the Content-Type header: iso-8859-1, which means windows-1252, curly quotes included', async () => {
        assert.equal((await getTitleAtUrl(`${server.url}/latin1`)).title, '“Café crème”');
      });

      test('a quoted, uppercase charset with no space after the semicolon', async () => {
        assert.equal((await getTitleAtUrl(`${server.url}/latin1-quoted`)).title, 'Crème brûlée');
      });

      test('gbk from the header', {skip: hasGbk ? false : 'no gbk TextDecoder in this runtime'}, async () => {
        assert.equal((await getTitleAtUrl(`${server.url}/gbk-header`)).title, '中文标题');
      });

      test('gbk from <meta charset>, skipping a commented-out one', {skip: hasGbk ? false : 'no gbk TextDecoder in this runtime'}, async () => {
        assert.equal((await getTitleAtUrl(`${server.url}/gbk-meta`)).title, '中文标题');
      });

      test('windows-1252 from <meta http-equiv="Content-Type">', async () => {
        assert.equal((await getTitleAtUrl(`${server.url}/http-equiv`)).title, '“Quoted”');
      });

      test('a <meta> that claims UTF-16 is read as UTF-8, as in HTML', async () => {
        assert.equal((await getTitleAtUrl(`${server.url}/meta-utf16`)).title, 'Déjà vu');
      });

      test('a byte order mark beats the header', async () => {
        assert.equal((await getTitleAtUrl(`${server.url}/utf8-bom`)).title, 'Café au BOM');
        assert.equal((await getTitleAtUrl(`${server.url}/utf16le`)).title, 'Little Endian');
        assert.equal((await getTitleAtUrl(`${server.url}/utf16be`)).title, 'Big Endian');
      });

      test('an unknown charset label falls back to UTF-8', async () => {
        assert.equal((await getTitleAtUrl(`${server.url}/unknown-charset`)).title, 'Unknown Charset');
      });
    });

    describe('redirects', () => {
      test('301 then 302 then 200: url is the final URL', async () => {
        assert.deepEqual(await getTitleAtUrl(`${server.url}/redirect-301`), {title: 'Fixture Page', url: `${server.url}/ok`, status: 200});
      });

      test('a relative Location', async () => {
        assert.equal((await getTitleAtUrl(`${server.url}/nested/relative`)).url, `${server.url}/ok`);
      });

      test('a redirect loop is a NETWORK_ERROR', async () => {
        const {error} = await getTitleAtUrl(`${server.url}/loop`);
        assert.equal(error.code, 'NETWORK_ERROR');
        assert.match(error.message, /^Request failed: /u);
      });
    });

    describe('failures come back as error, never thrown', () => {
      test('404 is an HTTP_ERROR with the status', async () => {
        const result = await getTitleAtUrl(`${server.url}/not-found`);
        assert.equal(result.title, undefined);
        assert.equal(result.status, 404);
        assert.equal(result.url, `${server.url}/not-found`);
        assert.ok(result.error instanceof GetTitleError);
        assert.ok(result.error instanceof Error);
        assert.equal(result.error.name, 'GetTitleError');
        assert.equal(result.error.code, 'HTTP_ERROR');
        assert.equal(result.error.status, 404);
        assert.equal(result.error.url, `${server.url}/not-found`);
        assert.equal(result.error.message, 'HTTP 404 Not Found');
      });

      test('500 is an HTTP_ERROR', async () => {
        const {error, status} = await getTitleAtUrl(`${server.url}/server-error`);
        assert.equal(error.code, 'HTTP_ERROR');
        assert.equal(status, 500);
      });

      test('a JSON response is NOT_HTML, even with a <title> in it', async () => {
        const {error, status} = await getTitleAtUrl(`${server.url}/json`);
        assert.equal(error.code, 'NOT_HTML');
        assert.equal(error.message, 'Expected an HTML page, got application/json');
        assert.equal(status, 200);
      });

      test('204 No Content is NO_TITLE', async () => {
        const {error, status} = await getTitleAtUrl(`${server.url}/no-content`);
        assert.equal(error.code, 'NO_TITLE');
        assert.equal(status, 204);
      });

      test('a page without a title is NO_TITLE', async () => {
        const {error} = await getTitleAtUrl(`${server.url}/no-title`);
        assert.equal(error.code, 'NO_TITLE');
      });

      test('a refused connection is a NETWORK_ERROR with the reason', async () => {
        const url = await closedPortUrl();
        const result = await getTitleAtUrl(url);
        assert.equal(result.error.code, 'NETWORK_ERROR');
        assert.match(result.error.message, /^Request failed: /u);
        assert.equal(result.url, url);
        assert.equal(result.status, undefined);
        assert.ok(result.error.cause);
      });

      // eslint-disable-next-line no-script-url -- an input the library must refuse
      for (const input of ['ftp://example.com/', 'javascript:alert(1)', 'data:text/html,<title>x</title>', 'file:///etc/hosts', '/relative/path', 'example.com', '', undefined, 42]) {
        test(`INVALID_URL for ${JSON.stringify(input) ?? 'undefined'}`, async () => {
          const result = await getTitleAtUrl(input);
          assert.equal(result.error.code, 'INVALID_URL');
          assert.equal(result.url, String(input));
          assert.match(result.error.message, /^Invalid URL ".*": expected an absolute http: or https: URL$/u);
        });
      }

      test('INVALID_URL for a value that cannot even be turned into a string, and a long input is shortened', async () => {
        const unprintable = await getTitleAtUrl(Object.create(null));
        assert.equal(unprintable.error.code, 'INVALID_URL');
        assert.equal(unprintable.url, '[object Object]');
        const long = await getTitleAtUrl('x'.repeat(300));
        assert.equal(long.url, `${'x'.repeat(200)}…`);
      });

      test('the error serializes with its code and message', async () => {
        const result = await getTitleAtUrl(`${server.url}/not-found`);
        // eslint-disable-next-line unicorn/prefer-structured-clone -- the JSON round trip is what is under test (toJSON)
        assert.deepEqual(JSON.parse(JSON.stringify(result)), {
          error: {
            name: 'GetTitleError', code: 'HTTP_ERROR', message: 'HTTP 404 Not Found', status: 404, url: `${server.url}/not-found`,
          },
          url: `${server.url}/not-found`,
          status: 404,
        });
      });

      test('options that throw when read still resolve, as a NETWORK_ERROR', async () => {
        const options = {
          get timeout() {
            throw new Error('boom');
          },
        };
        const {error} = await getTitleAtUrl(`${server.url}/ok`, options);
        assert.equal(error.code, 'NETWORK_ERROR');
        assert.equal(error.message, 'Request failed: boom');
      });

      test('an invalid header name is a NETWORK_ERROR, not a throw', async () => {
        const {error} = await getTitleAtUrl(`${server.url}/ok`, {headers: {'bad header': 'x'}});
        assert.equal(error.code, 'NETWORK_ERROR');
      });
    });

    describe('timeouts and aborts', () => {
      test('the timeout option gives TIMEOUT', async () => {
        const result = await getTitleAtUrl(`${server.url}/slow`, {timeout: 100});
        assert.equal(result.error.code, 'TIMEOUT');
        assert.equal(result.error.message, 'Timed out after 100 ms');
        assert.equal(result.status, undefined);
        assert.equal(result.url, `${server.url}/slow`);
      });

      test('a timeout while the body is still arriving gives TIMEOUT with the status', async () => {
        const result = await getTitleAtUrl(`${server.url}/slow-body`, {timeout: 200});
        assert.equal(result.error.code, 'TIMEOUT');
        assert.equal(result.status, 200);
      });

      test('the caller aborting mid-request gives TIMEOUT', async () => {
        const {error} = await getTitleAtUrl(`${server.url}/slow`, {signal: AbortSignal.timeout(50)});
        assert.equal(error.code, 'TIMEOUT');
        assert.equal(error.message, 'The request was aborted');
      });

      test('an already aborted signal gives TIMEOUT', async () => {
        const {error} = await getTitleAtUrl(`${server.url}/ok`, {signal: AbortSignal.abort()});
        assert.equal(error.code, 'TIMEOUT');
      });

      test('without AbortSignal.any (older runtimes) the signals are still combined', async () => {
        await withGlobal(AbortSignal, 'any', undefined, async () => {
          assert.equal((await getTitleAtUrl(`${server.url}/slow`, {signal: AbortSignal.timeout(50)})).error.message, 'The request was aborted');
          assert.equal((await getTitleAtUrl(`${server.url}/slow`, {signal: new AbortController().signal, timeout: 100})).error.message, 'Timed out after 100 ms');
          assert.equal((await getTitleAtUrl(`${server.url}/slow`, {signal: AbortSignal.abort()})).error.code, 'TIMEOUT');
          assert.equal((await getTitleAtUrl(`${server.url}/ok`, {signal: new AbortController().signal})).title, 'Fixture Page');
        });
      });

      test('a timeout that is not a number means the default; a huge one is capped', async () => {
        assert.equal((await getTitleAtUrl(`${server.url}/ok`, {timeout: NaN})).title, 'Fixture Page');
        assert.equal((await getTitleAtUrl(`${server.url}/ok`, {timeout: Infinity})).title, 'Fixture Page');
      });
    });

    describe('reading only as much as needed', () => {
      test('a 5 MiB page: the title comes back without reading it all', async () => {
        assert.equal((await getTitleAtUrl(`${server.url}/big`)).title, 'Big Page');
      });

      test('an endless page: reading stops at maxBytes', async () => {
        const result = await getTitleAtUrl(`${server.url}/endless`, {maxBytes: 64 * 1024});
        assert.equal(result.title, 'Endless Page');
        // Give the server a moment to see the connection close, then check it never streamed to its safety limit.
        await new Promise(resolve => {
          setTimeout(resolve, 100);
        });
        assert.ok(server.stats.endlessBytes < ENDLESS_SAFETY_LIMIT, `server wrote ${server.stats.endlessBytes} bytes`);
      });

      test('a title past maxBytes is not seen', async () => {
        assert.equal((await getTitleAtUrl(`${server.url}/late-title`)).error.code, 'NO_TITLE');
        assert.equal((await getTitleAtUrl(`${server.url}/late-title`, {maxBytes: 4 * 1024 * 1024})).title, 'Too Late');
        assert.equal((await getTitleAtUrl(`${server.url}/ok`, {maxBytes: 0})).error.code, 'NO_TITLE');
      });
    });

    describe('request headers', () => {
      test('sends the default User-Agent and Accept', async () => {
        await getTitleAtUrl(`${server.url}/record?id=defaults-${name}`);
        const headers = server.received.get(`defaults-${name}`);
        assert.equal(headers['user-agent'], `get-title-at-url/${version} (+https://github.com/m4bwav/get-title-at-url)`);
        assert.equal(headers.accept, 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.1');
      });

      test('custom headers are added, and override the defaults whatever their case', async () => {
        await getTitleAtUrl(`${server.url}/record?id=custom-${name}`, {headers: {'X-Test': 'yes', 'User-Agent': 'custom-agent/1.0'}});
        const headers = server.received.get(`custom-${name}`);
        assert.equal(headers['x-test'], 'yes');
        assert.equal(headers['user-agent'], 'custom-agent/1.0');
      });
    });

    describe('an injected fetch', () => {
      test('works with nothing but a hand-built WHATWG Response', async () => {
        const calls = [];
        const fetch = async (url, init) => {
          calls.push({url, init});
          return new Response('<title>Injected | Somewhere</title>', {headers: {'content-type': 'text/html'}});
        };

        assert.deepEqual(await getTitleAtUrl('https://example.test/page', {fetch}), {title: 'Injected', url: 'https://example.test/page', status: 200});
        assert.equal(calls.length, 1);
        assert.equal(calls[0].url, 'https://example.test/page');
        assert.ok(calls[0].init.signal instanceof AbortSignal);
        assert.equal(calls[0].init.redirect, 'follow');
        assert.equal(calls[0].init.headers.get('user-agent'), `get-title-at-url/${version} (+https://github.com/m4bwav/get-title-at-url)`);
      });

      test('a fetch that throws gives NETWORK_ERROR with the cause', async () => {
        const cause = new Error('socket hang up');
        const thrown = await getTitleAtUrl('https://example.test/', {
          async fetch() {
            throw cause;
          },
        });
        assert.equal(thrown.error.code, 'NETWORK_ERROR');
        assert.equal(thrown.error.message, 'Request failed: socket hang up');
        assert.equal(thrown.error.cause, cause);

        const rejectedWithText = await getTitleAtUrl('https://example.test/', {
          fetch: () => Promise.reject('plain text'), // eslint-disable-line prefer-promise-reject-errors -- the point of the test
        });
        assert.equal(rejectedWithText.error.message, 'Request failed: plain text');
      });

      test('a response with no web stream is read through arrayBuffer()', async () => {
        const html = new TextEncoder().encode('<title>No Stream</title>');
        const response = {
          ok: true,
          status: 200,
          statusText: 'OK',
          url: 'https://example.test/final',
          headers: new Headers({'content-type': 'text/html'}),
          body: undefined,
          arrayBuffer: async () => html.buffer,
        };
        assert.deepEqual(await getTitleAtUrl('https://example.test/', {fetch: async () => response}), {title: 'No Stream', url: 'https://example.test/final', status: 200});
        assert.equal((await getTitleAtUrl('https://example.test/', {fetch: async () => response, maxBytes: 10})).error.code, 'NO_TITLE');
      });

      test('an HTTP error without a status text', async () => {
        const {error} = await getTitleAtUrl('https://example.test/', {fetch: async () => new Response('', {status: 503})});
        assert.equal(error.message, 'HTTP 503');
      });

      test('no fetch anywhere is a NETWORK_ERROR that says so', async () => {
        await withGlobal(globalThis, 'fetch', undefined, async () => {
          const {error} = await getTitleAtUrl('https://example.test/');
          assert.equal(error.code, 'NETWORK_ERROR');
          assert.match(error.message, /no fetch/u);
        });
      });

      test('options may be null (JavaScript callers)', async () => {
        assert.equal((await getTitleAtUrl(`${server.url}/ok`, null)).title, 'Fixture Page');
      });
    });
  });
}
