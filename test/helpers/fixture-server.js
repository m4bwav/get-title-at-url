// A local HTTP server with one route per behaviour the tests need, so no test depends on the live internet.
import {Buffer} from 'node:buffer';
import {createServer} from 'node:http';

const HTML = 'text/html; charset=utf-8';

// Keeps a client that fails to stop reading from streaming forever.
export const ENDLESS_SAFETY_LIMIT = 64 * 1024 * 1024;

const page = (title, head = '') => `<!doctype html><html><head><meta charset="utf-8">${head}<title>${title}</title></head><body><h1>A different heading</h1></body></html>`;

// 中文标题 ("Chinese title") in GBK.
const GBK_TITLE = Buffer.from([0xD6, 0xD0, 0xCE, 0xC4, 0xB1, 0xEA, 0xCC, 0xE2]);
const GBK_WITH_HEADER = Buffer.concat([Buffer.from('<html><head><title>'), GBK_TITLE, Buffer.from('</title></head></html>')]);
const GBK_WITH_META = Buffer.concat([Buffer.from('<html><head><!-- <meta charset="big5"> --><meta charset="gbk"><title>'), GBK_TITLE, Buffer.from('</title></head></html>')]);

// Three http-equiv tags: one about something else, one without a charset, then the real declaration. 0x93 and 0x94 are curly quotes in windows-1252.
const WINDOWS_1252_HTTP_EQUIV = Buffer.concat([
  Buffer.from('<html><head><meta http-equiv="refresh" content="30"><meta http-equiv="Content-Type" content="text/html">'),
  Buffer.from('<meta http-equiv="content-type" content="text/html; charset=windows-1252"><title>'),
  Buffer.from([0x93]),
  Buffer.from('Quoted'),
  Buffer.from([0x94]),
  Buffer.from('</title></head></html>'),
]);

const UTF8_BOM = Buffer.concat([Buffer.from([0xEF, 0xBB, 0xBF]), Buffer.from(page('Café au BOM'))]);
const UTF16LE_BOM = Buffer.concat([Buffer.from([0xFF, 0xFE]), Buffer.from(page('Little Endian'), 'utf16le')]);
const UTF16BE_BOM = Buffer.concat([Buffer.from([0xFE, 0xFF]), Buffer.from(page('Big Endian'), 'utf16le').swap16()]);
const LATE_TITLE = `<!doctype html><html><head><!-- ${'x'.repeat(1.5 * 1024 * 1024)} --><title>Too Late</title></head></html>`;

// An empty contentType sends no Content-Type header at all.
function send(response, status, body = '', contentType = HTML) {
  response.writeHead(status, contentType === '' ? {} : {'content-type': contentType});
  response.end(body);
}

function redirect(response, status, location) {
  response.writeHead(status, {location});
  response.end();
}

// Stream `head`, then filler until `total` bytes or until the client goes away, respecting backpressure.
function stream(response, head, total, onWrite = () => {}) {
  response.writeHead(200, {'content-type': HTML});
  let written = Buffer.byteLength(head);
  response.write(head);
  let isOpen = true;
  response.on('close', () => {
    isOpen = false;
  });
  const chunk = Buffer.alloc(64 * 1024, 'x');
  const pump = () => {
    while (written < total) {
      // Checked on every pass: after a 'drain' the client may already have gone.
      if (!isOpen) {
        return;
      }

      written += chunk.length;
      onWrite(written);
      if (!response.write(chunk)) {
        response.once('drain', pump);
        return;
      }
    }

    response.end('</body></html>');
  };

  pump();
}

// Answer after `ms`, unless the client gives up first.
function later(response, ms, answer) {
  const timer = setTimeout(answer, ms);
  response.on('close', () => {
    clearTimeout(timer);
  });
}

const routes = {
  '/ok': (_request, response) => send(response, 200, page('Fixture Page')),
  '/site-suffix': (_request, response) => send(response, 200, page('Post Title | Fixture Site', '<meta property="og:site_name" content="Fixture Site">')),
  '/og-only': (_request, response) => send(response, 200, '<html><head><meta property="og:title" content="Only &amp; Open Graph"></head></html>'),
  '/no-title': (_request, response) => send(response, 200, '<html><head></head><body><p>Nothing here</p></body></html>'),
  '/latin1': (_request, response) => send(response, 200, Buffer.from('<title>\u{93}Café crème\u{94}</title>', 'latin1'), 'text/html; charset=iso-8859-1'),
  '/latin1-quoted': (_request, response) => send(response, 200, Buffer.from('<title>Crème brûlée</title>', 'latin1'), 'text/html;charset="ISO-8859-1"'),
  '/gbk-header': (_request, response) => send(response, 200, GBK_WITH_HEADER, 'text/html; charset=gbk'),
  '/gbk-meta': (_request, response) => send(response, 200, GBK_WITH_META, 'text/html'),
  '/http-equiv': (_request, response) => send(response, 200, WINDOWS_1252_HTTP_EQUIV, 'text/html'),
  '/meta-utf16': (_request, response) => send(response, 200, '<html><head><meta charset="utf-16"><title>Déjà vu</title></head></html>', 'text/html'),
  '/utf8-bom': (_request, response) => send(response, 200, UTF8_BOM, 'text/html; charset=iso-8859-1'),
  '/utf16le': (_request, response) => send(response, 200, UTF16LE_BOM, 'text/html'),
  '/utf16be': (_request, response) => send(response, 200, UTF16BE_BOM, 'text/html'),
  '/unknown-charset': (_request, response) => send(response, 200, page('Unknown Charset'), 'text/html; charset=x-no-such-encoding'),
  '/xhtml': (_request, response) => send(response, 200, page('XHTML Page'), 'application/xhtml+xml; charset=utf-8'),
  '/no-content-type': (_request, response) => send(response, 200, page('No Content Type'), ''),
  '/no-content': (_request, response) => send(response, 204, '', ''),
  '/json': (_request, response) => send(response, 200, '{"html": "<title>Not a page</title>"}', 'application/json'),
  '/redirect-301': (_request, response) => redirect(response, 301, '/redirect-302'),
  '/redirect-302': (_request, response) => redirect(response, 302, '/ok'),
  '/nested/relative': (_request, response) => redirect(response, 302, '../ok'),
  '/loop': (_request, response) => redirect(response, 302, '/loop'),
  '/not-found': (_request, response) => send(response, 404, page('Not Found Page')),
  '/server-error': (_request, response) => send(response, 500, page('Server Error Page')),
  '/slow': (_request, response) => later(response, 5000, () => send(response, 200, page('Too Slow'))),
  '/slow-body'(_request, response) {
    response.writeHead(200, {'content-type': HTML});
    response.write('<!doctype html><html><head>');
    later(response, 5000, () => response.end('<title>Too Slow</title></head></html>'));
  },
  '/big': (_request, response) => stream(response, '<!doctype html><html><head><title>Big Page</title></head><body>', 5 * 1024 * 1024),
  '/late-title': (_request, response) => send(response, 200, LATE_TITLE),
};

export async function startFixtureServer() {
  const received = new Map();
  const stats = {endlessBytes: 0};
  const server = createServer((request, response) => {
    const {pathname, searchParams} = new URL(request.url, 'http://127.0.0.1');
    if (pathname === '/record') {
      received.set(searchParams.get('id'), request.headers);
      send(response, 200, page('Recorded'));
      return;
    }

    if (pathname === '/endless') {
      stream(response, '<!doctype html><html><head><title>Endless Page</title></head><body>', ENDLESS_SAFETY_LIMIT, written => {
        stats.endlessBytes = written;
      });
      return;
    }

    const route = routes[pathname];
    if (route) {
      route(request, response);
    } else {
      send(response, 404, page('No Such Route'));
    }
  });

  await new Promise(resolve => {
    server.listen(0, '127.0.0.1', resolve);
  });

  return {
    url: `http://127.0.0.1:${server.address().port}`,
    received,
    stats,
    async close() {
      server.closeAllConnections();
      await new Promise(resolve => {
        server.close(resolve);
      });
    },
  };
}
