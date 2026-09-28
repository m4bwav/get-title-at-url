// wiki-verify for get-title-at-url@3.0.0: runs every example on the wiki against the
// PUBLISHED package, never the working tree. The repository keeps this file as
// ai-docs/notes/2026-09-28-wiki-verify.mjs so the next release can run it again.
//
// Run it from a scratch folder outside the repository:
//   npm init -y
//   npm install get-title-at-url@3.0.0 typescript@6
//   node wiki-verify.mjs > wiki-verify.out.txt
//
// Optional: V2=<folder with get-title-at-url@2.0.0 installed> and V1=<folder with 1.1.8>
// add the Versions and upgrading cases for the old majors.
//
// Every case prints "## <label>" and then its output. The package talks only to the
// local fixture server below, never the internet.

import http from 'node:http';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import util from 'node:util';

const PACKAGE = 'get-title-at-url';
const VERSION = '3.0.0';
const require = createRequire(import.meta.url);

function show(label, value) {
	console.log(`## ${label}`);
	console.log(typeof value === 'string' ? value : inspect(value));
	console.log();
}

function inspect(value) {
	return JSON.stringify(value, (key, v) => {
		if (v === undefined) {
			return '<undefined>';
		}

		if (v instanceof Error) {
			return {name: v.name, message: v.message, ...v, cause: v.cause ? String(v.cause) : undefined};
		}

		return v;
	}, 2);
}

// Results as a reader would print them: the error's fields, not the object.
function brief(result) {
	if (result.error) {
		const {code, message, status, url} = result.error;
		return {error: {code, message, status, url}, url: result.url, status: result.status};
	}

	return result;
}

async function capture(label, fn) {
	try {
		show(label, await fn());
	} catch (error) {
		show(`${label} (threw)`, `${error?.name}: ${error?.message}`);
	}
}

// ----- the installed package -----
const pkgDir = path.join(process.cwd(), 'node_modules', PACKAGE);
const pkg = JSON.parse(readFileSync(path.join(pkgDir, 'package.json'), 'utf8'));
if (pkg.version !== VERSION) {
	throw new Error(`installed ${pkg.version}, expected ${VERSION}`);
}

show('installed', `${PACKAGE}@${pkg.version} on Node ${process.version}`);
const esm = await import(PACKAGE);
const cjs = require(PACKAGE);
const {getTitleAtUrl, extractTitle, GetTitleError} = esm;
show('esm exports', Object.keys(esm).sort());
show('cjs exports', Object.keys(cjs).sort());
show('cjs default is the same function', String(cjs.default === cjs.getTitleAtUrl));
show('esm default is getTitleAtUrl', String(esm.default === esm.getTitleAtUrl));
show('package.json exports, bin, engines, files in tarball', {exports: pkg.exports, bin: pkg.bin, engines: pkg.engines});

const binEntry = Object.values(pkg.bin)[0];
// Async on purpose: spawnSync would block this process's event loop, and with it the fixture server.
function cli(...args) {
	return new Promise(resolve => {
		const child = spawn(process.execPath, [path.join(pkgDir, binEntry), ...args]);
		let stdout = '';
		let stderr = '';
		child.stdout.on('data', chunk => {
			stdout += chunk;
		});
		child.stderr.on('data', chunk => {
			stderr += chunk;
		});
		child.on('close', code => {
			resolve(`exit ${code}\n--- stdout\n${stdout}--- stderr\n${stderr}`);
		});
	});
}

// ----- local fixture server: one route per behaviour -----
const html = (title, head = '') => `<!doctype html><html><head>${head}<title>${title}</title></head><body><h1>Heading</h1></body></html>`;
const send = (response, status, headers, body) => {
	response.writeHead(status, headers);
	response.end(body);
};
const utf8 = {'content-type': 'text/html; charset=utf-8'};
const routes = {
	'/'(q, r) {
		send(r, 200, utf8, html('Example Domain'));
	},
	'/docs'(q, r) {
		send(r, 200, utf8, html('Getting started | Acme Docs'));
	},
	'/site-name-first'(q, r) {
		send(r, 200, utf8, html('Acme Docs - Getting started', '<meta property="og:site_name" content="Acme Docs">'));
	},
	'/short'(q, r) {
		send(r, 200, utf8, html('FAQ | Acme'));
	},
	'/hyphen'(q, r) {
		send(r, 200, utf8, html('Node-API docs'));
	},
	'/og-only'(q, r) {
		send(r, 200, utf8, '<html><head><meta property="og:title" content="From og:title"></head></html>');
	},
	'/twitter-only'(q, r) {
		send(r, 200, utf8, '<html><head><meta name="twitter:title" content="From twitter:title"></head></html>');
	},
	'/empty-title'(q, r) {
		send(r, 200, utf8, '<html><head><title>  </title><meta property="og:title" content="Fallback"></head></html>');
	},
	'/no-title'(q, r) {
		send(r, 200, utf8, '<html><body><h1>Only a heading</h1></body></html>');
	},
	'/heading-differs'(q, r) {
		send(r, 200, utf8, html('The real title'));
	},
	'/entities'(q, r) {
		send(r, 200, utf8, html('Tom &amp; Jerry &copy; 2026 &hellip; AT&T &nosuch; &#8212; &#x263A;'));
	},
	'/hidden-titles'(q, r) {
		send(r, 200, utf8, '<html><head><!-- <title>In a comment</title> --><script>document.title = "<title>In a script</title>"</script><svg><title>In an SVG</title></svg><title>The document title</title></head></html>');
	},
	'/whitespace'(q, r) {
		send(r, 200, utf8, html('\n   Lots\t of\n   space   '));
	},
	'/redirect'(q, r) {
		send(r, 301, {location: '/'}, '');
	},
	'/loop'(q, r) {
		send(r, 302, {location: '/loop'}, '');
	},
	'/missing'(q, r) {
		send(r, 404, {'content-type': 'text/html'}, html('Not Found'));
	},
	'/broken'(q, r) {
		send(r, 500, {'content-type': 'text/plain'}, 'boom');
	},
	'/json'(q, r) {
		send(r, 200, {'content-type': 'application/json'}, '{"title":"not html"}');
	},
	'/no-content-type'(q, r) {
		send(r, 200, {}, html('Served without a Content-Type'));
	},
	'/xhtml'(q, r) {
		send(r, 200, {'content-type': 'application/xhtml+xml'}, '<html xmlns="http://www.w3.org/1999/xhtml"><head><title>An XHTML page</title></head></html>');
	},
	'/slow'(q, r) {
		setTimeout(() => {
			send(r, 200, utf8, html('Too late'));
		}, 1500);
	},
	'/windows-1252'(q, r) {
		const title = Buffer.from([147, 67, 117, 114, 108, 121, 148, 32, 113, 117, 111, 116, 101, 115, 32, 150, 32, 97, 110, 100, 32, 128, 32, 53]);
		send(r, 200, {'content-type': 'text/html; charset=windows-1252'}, Buffer.concat([Buffer.from('<title>'), title, Buffer.from('</title>')]));
	},
	'/shift-jis-meta'(q, r) {
		const title = Buffer.from([145, 190, 141, 201, 142, 161, 32, 145, 150, 130, 234, 131, 129, 131, 141, 131, 88]);
		send(r, 200, {'content-type': 'text/html'}, Buffer.concat([Buffer.from('<meta charset="shift_jis"><title>'), title, Buffer.from('</title>')]));
	},
	'/utf16'(q, r) {
		send(r, 200, {'content-type': 'text/html'}, Buffer.concat([Buffer.from([0xFF, 0xFE]), Buffer.from('<title>UTF-16 with a byte order mark</title>', 'utf16le')]));
	},
	'/late-title'(q, r) {
		send(r, 200, utf8, `<html><head>${'<meta name="x" content="padding">'.repeat(40_000)}<title>Found late</title></head></html>`);
	},
	'/echo-headers'(q, r) {
		send(r, 200, utf8, html(`${q.headers['user-agent']} || ${q.headers.accept}`));
	},
};
const seen = [];
const server = http.createServer((request, response) => {
	seen.push(`${request.method} ${request.url}`);
	const route = routes[new URL(request.url, 'http://x').pathname];
	if (route) {
		route(request, response);
	} else {
		send(response, 404, {'content-type': 'text/plain'}, 'not found');
	}
});
await new Promise(resolve => {
	server.listen(0, '127.0.0.1', resolve);
});
const base = `http://127.0.0.1:${server.address().port}`;
show('fixture base', base);

// A port with nothing listening, for NETWORK_ERROR.
const closed = http.createServer();
await new Promise(resolve => {
	closed.listen(0, '127.0.0.1', resolve);
});
const closedPort = closed.address().port;
await new Promise(resolve => {
	closed.close(resolve);
});

// ===== Home and Getting started =====
await capture('home: title, url, status', async () => getTitleAtUrl(`${base}/`));
await capture('getting-started: esm destructure', async () => {
	const {title, error} = await getTitleAtUrl(`${base}/`);
	return title ?? error.message;
});
await capture('getting-started: cjs then', async () => cjs.getTitleAtUrl(`${base}/`).then(({title}) => title));
await capture('getting-started: URL object input', async () => getTitleAtUrl(new URL('/docs', base)));

// ===== API reference: getTitleAtUrl results and errors =====
await capture('api: INVALID_URL no scheme', async () => brief(await getTitleAtUrl('example.com')));
await capture('api: INVALID_URL ftp', async () => brief(await getTitleAtUrl('ftp://example.com/file')));
await capture('api: INVALID_URL empty', async () => brief(await getTitleAtUrl('')));
await capture('api: INVALID_URL number (JS caller)', async () => brief(await getTitleAtUrl(42)));
await capture('api: INVALID_URL long input is cut', async () => {
	const {url, error} = await getTitleAtUrl('x'.repeat(300));
	return {urlLength: url.length, endsWithEllipsis: url.endsWith('…'), messageLength: error.message.length};
});
await capture('api: options that throw when read', async () => brief(await getTitleAtUrl(`${base}/`, {
	get timeout() {
		throw new Error('bad getter');
	},
})));
await capture('api: HTTP_ERROR 404', async () => brief(await getTitleAtUrl(`${base}/missing`)));
await capture('api: HTTP_ERROR 500', async () => brief(await getTitleAtUrl(`${base}/broken`)));
await capture('api: NETWORK_ERROR refused', async () => brief(await getTitleAtUrl(`http://127.0.0.1:${closedPort}/`)));
await capture('api: NETWORK_ERROR redirect loop', async () => brief(await getTitleAtUrl(`${base}/loop`)));
await capture('api: TIMEOUT', async () => brief(await getTitleAtUrl(`${base}/slow`, {timeout: 200})));
await capture('api: TIMEOUT from signal', async () => {
	const controller = new AbortController();
	setTimeout(() => {
		controller.abort();
	}, 100);
	return brief(await getTitleAtUrl(`${base}/slow`, {signal: controller.signal}));
});
await capture('api: signal already aborted', async () => brief(await getTitleAtUrl(`${base}/`, {signal: AbortSignal.abort()})));
await capture('api: NOT_HTML json', async () => brief(await getTitleAtUrl(`${base}/json`)));
await capture('api: NO_TITLE', async () => brief(await getTitleAtUrl(`${base}/no-title`)));
await capture('api: error is GetTitleError and Error', async () => {
	const {error} = await getTitleAtUrl(`${base}/missing`);
	return {instanceofGetTitleError: error instanceof GetTitleError, instanceofError: error instanceof Error, name: error.name, cjsClassSame: cjs.GetTitleError === GetTitleError};
});
await capture('api: network error cause', async () => {
	const {error} = await getTitleAtUrl(`http://127.0.0.1:${closedPort}/`);
	return {cause: String(error.cause), causeCause: String(error.cause?.cause)};
});
await capture('api: JSON.stringify(result) success', async () => JSON.stringify(await getTitleAtUrl(`${base}/`)));
await capture('api: JSON.stringify(result) failure', async () => JSON.stringify(await getTitleAtUrl(`${base}/missing`)));
await capture('api: new GetTitleError', async () => {
	const error = new GetTitleError('NO_TITLE', 'custom', {status: 200, url: 'https://example.com/'});
	return {json: JSON.stringify(error), message: error.message, code: error.code};
});

// ===== options =====
await capture('options: default headers', async () => getTitleAtUrl(`${base}/echo-headers`));
// The API reference shows the two headers as request lines; the fixture echoes them into the title.
await capture('options: default headers, as the server received them', async () => {
	const [userAgent, accept] = (await getTitleAtUrl(`${base}/echo-headers`)).title.split(' || ');
	return `User-Agent: ${userAgent}\nAccept: ${accept}`;
});
await capture('options: headers override user-agent (any case)', async () => getTitleAtUrl(`${base}/echo-headers`, {headers: {'User-Agent': 'my-bot/1.0'}}));
await capture('options: maxBytes too small', async () => brief(await getTitleAtUrl(`${base}/late-title`, {maxBytes: 65_536})));
await capture('options: maxBytes default misses it', async () => brief(await getTitleAtUrl(`${base}/late-title`)));
await capture('options: maxBytes 2 MB finds it', async () => getTitleAtUrl(`${base}/late-title`, {maxBytes: 2_000_000}));
await capture('options: late-title page size', async () => `${routes['/late-title'].toString().length} (source); page bytes ${'<meta name="x" content="padding">'.length * 40_000 + 60}`);
await capture('options: maxBytes 0', async () => brief(await getTitleAtUrl(`${base}/`, {maxBytes: 0})));
await capture('options: timeout NaN uses default', async () => getTitleAtUrl(`${base}/`, {timeout: Number.NaN}));
await capture('options: custom fetch (Response built by hand)', async () => getTitleAtUrl('https://example.com/', {
	fetch: async () => new Response('<title>From my fetch</title>', {headers: {'content-type': 'text/html'}}),
}));
await capture('options: custom fetch that throws', async () => brief(await getTitleAtUrl('https://example.com/', {
	async fetch() {
		throw new TypeError('proxy refused');
	},
})));
await capture('options: no fetch in runtime', async () => {
	const saved = globalThis.fetch;
	globalThis.fetch = undefined;
	try {
		return brief(await getTitleAtUrl(`${base}/`));
	} finally {
		globalThis.fetch = saved;
	}
});

// ===== behaviour: redirects, content types, charsets =====
await capture('behaviour: redirect, final url', async () => getTitleAtUrl(`${base}/redirect`));
await capture('behaviour: no content-type is read as HTML', async () => getTitleAtUrl(`${base}/no-content-type`));
await capture('behaviour: xhtml', async () => getTitleAtUrl(`${base}/xhtml`));
await capture('behaviour: windows-1252 header', async () => getTitleAtUrl(`${base}/windows-1252`));
await capture('behaviour: windows-1252 header, clean false', async () => {
	const response = await fetch(`${base}/windows-1252`);
	const text = new TextDecoder('windows-1252').decode(await response.arrayBuffer());
	return extractTitle(text, {clean: false});
});
await capture('behaviour: shift_jis meta', async () => getTitleAtUrl(`${base}/shift-jis-meta`));
await capture('behaviour: utf-16 bom', async () => getTitleAtUrl(`${base}/utf16`));
await capture('behaviour: og:title fallback', async () => getTitleAtUrl(`${base}/og-only`));
await capture('behaviour: twitter:title fallback', async () => getTitleAtUrl(`${base}/twitter-only`));
await capture('behaviour: blank title falls back', async () => getTitleAtUrl(`${base}/empty-title`));
await capture('behaviour: title over heading', async () => getTitleAtUrl(`${base}/heading-differs`));
await capture('behaviour: entities', async () => getTitleAtUrl(`${base}/entities`));
await capture('behaviour: hidden titles skipped', async () => getTitleAtUrl(`${base}/hidden-titles`));
await capture('behaviour: whitespace collapsed', async () => getTitleAtUrl(`${base}/whitespace`));
await capture('behaviour: site suffix removed', async () => getTitleAtUrl(`${base}/docs`));
await capture('behaviour: og:site_name prefix removed', async () => getTitleAtUrl(`${base}/site-name-first`));
await capture('behaviour: short first part kept whole', async () => getTitleAtUrl(`${base}/short`));
await capture('behaviour: hyphenated word kept', async () => getTitleAtUrl(`${base}/hyphen`));

// ===== extractTitle =====
const x = (label, ...args) => show(`extract: ${label}`, inspect(extractTitle(...args)));
x('readme clean', '<title>Getting started | Acme Docs</title>');
x('readme clean false', '<title>Getting started | Acme Docs</title>', {clean: false});
x('none', '<p>no title here</p>');
x('empty string', '');
x('home short part', '<title>Home | Acme</title>');
x('abc short part', '<title>API | Acme</title>');
show('extract: each separator', ['|', '-', '–', '—', '·', '»', '::'].map(s => `${s} => ${extractTitle(`<title>Release notes ${s} Acme</title>`)}`).join(' / '));
x('spaced dash inside a real title', '<title>Pros – and cons</title>');
x('spaced dash, clean false', '<title>Pros – and cons</title>', {clean: false});
x('no spaces around separator', '<title>Release notes|Acme</title>');
x('several separators', '<title>Install - Guide - Acme</title>');
x('site name as suffix exact', '<title>Pricing — Acme Cloud</title><meta property="og:site_name" content="Acme Cloud">');
x('site name not matching', '<title>Pricing — Acme Cloud</title><meta property="og:site_name" content="Acme">');
x('site name case-insensitive', '<title>Pricing | ACME</title><meta property="og:site_name" content="acme">');
x('title attribute order and case', '<TITLE lang="en">Upper case tag</TITLE>');
x('nbsp collapsed', '<title>A&nbsp;&nbsp;B</title>');
x('numeric 150 is windows-1252', '<title>A &#150; B</title>');
x('unknown entity kept', '<title>Fish &chips; AT&T</title>');
x('first title wins', '<title>One</title><title>Two</title>');
x('meta first tag wins', '<meta property="og:title" content="First"><meta property="og:title" content="Second">');
x('meta name vs property', '<meta name="og:title" content="og via name">');
x('unclosed title', '<title>Never closed');

// ===== typescript narrowing =====
writeFileSync('narrow.mts', [
	"import getTitleAtUrl, {extractTitle, GetTitleError, type GetTitleResult, type GetTitleErrorCode} from 'get-title-at-url';",
	"const result: GetTitleResult = await getTitleAtUrl('https://example.com/');",
	'if (result.error) {',
	'  const code: GetTitleErrorCode = result.error.code;',
	'  const status: number | undefined = result.status;',
	'  console.log(code, status, result.error instanceof GetTitleError);',
	'} else {',
	'  const title: string = result.title;',
	'  const status: number = result.status;',
	'  console.log(title, status);',
	'}',
	"const maybe: string | undefined = extractTitle('<title>x</title>');",
	'console.log(maybe);',
	'',
].join('\n'));
await capture('typescript: tsc nodenext', async () => new Promise(resolve => {
	const tsc = path.join(process.cwd(), 'node_modules', 'typescript', 'bin', 'tsc');
	const child = spawn(process.execPath, [tsc, '--noEmit', '--strict', '--module', 'nodenext', '--moduleResolution', 'nodenext', '--target', 'es2022', '--skipLibCheck', 'false', 'narrow.mts']);
	let out = '';
	child.stdout.on('data', c => {
		out += c;
	});
	child.stderr.on('data', c => {
		out += c;
	});
	child.on('close', code => {
		resolve(`exit ${code} ${out}`);
	});
}));

// ===== Commands =====
show('commands: --help', await cli('--help'));
show('commands: --version', await cli('--version'));
show('commands: -v', await cli('-v'));
show('commands: title', await cli(`${base}/`));
show('commands: --json success', await cli(`${base}/`, '--json'));
show('commands: --json failure', await cli(`${base}/missing`, '--json'));
show('commands: no title', await cli(`${base}/no-title`));
show('commands: not html', await cli(`${base}/json`));
show('commands: invalid url', await cli('example.com'));
show('commands: timeout', await cli(`${base}/slow`, '--timeout', '200'));
show('commands: bad timeout', await cli(`${base}/`, '--timeout', 'soon'));
show('commands: zero timeout', await cli(`${base}/`, '--timeout', '0'));
show('commands: no url', await cli());
show('commands: two urls', await cli(`${base}/`, `${base}/docs`));
show('commands: unknown option', await cli(`${base}/`, '--verbose'));
show('commands: timeout equals form', await cli(`${base}/`, '--timeout=5000'));

// ===== Recipes =====
let flakyCalls = 0;
routes['/flaky'] = (q, r) => {
	flakyCalls++;
	if (flakyCalls === 1) {
		send(r, 503, {'content-type': 'text/plain'}, 'try later');
	} else {
		send(r, 200, utf8, html('Worked on try two'));
	}
};

await capture('recipes: many urls, four at a time', async () => {
	async function titles(urls, concurrency = 4) {
		const results = new Array(urls.length);
		let next = 0;
		async function worker() {
			while (next < urls.length) {
				const index = next++;
				// eslint-disable-next-line no-await-in-loop
				results[index] = await getTitleAtUrl(urls[index], {timeout: 5000});
			}
		}

		await Promise.all(Array.from({length: Math.min(concurrency, urls.length)}, worker));
		return results;
	}

	const urls = ['/', '/docs', '/missing', '/og-only', '/json'].map(p => `${base}${p}`);
	const results = await titles(urls);
	// Printed as console.log prints it, because the Recipes page shows console.log output (wikiwright L-008).
	return util.inspect(results.map(r => r.title ?? `${r.error.code}`));
});

await capture('recipes: retry', async () => {
	const retryable = new Set(['TIMEOUT', 'NETWORK_ERROR']);
	async function getTitleWithRetry(url, {attempts = 3, delay = 100, ...options} = {}) {
		let result;
		for (let attempt = 1; attempt <= attempts; attempt++) {
			// eslint-disable-next-line no-await-in-loop
			result = await getTitleAtUrl(url, options);
			const code = result.error?.code;
			const serverBusy = code === 'HTTP_ERROR' && (result.status === 429 || result.status >= 500);
			if (!code || !(retryable.has(code) || serverBusy)) {
				return result;
			}

			// eslint-disable-next-line no-await-in-loop
			await new Promise(resolve => {
				setTimeout(resolve, delay * attempt);
			});
		}

		return result;
	}

	const result = await getTitleWithRetry(`${base}/flaky`);
	show('recipes: retry, the result', result);
	return {requests: flakyCalls};
});

await capture('recipes: test double', async () => {
	const pages = new Map([['https://shop.test/', '<title>Shop | Test</title>']]);
	const fakeFetch = async url => pages.has(url)
		? new Response(pages.get(url), {headers: {'content-type': 'text/html'}})
		: new Response('', {status: 404, statusText: 'Not Found'});
	// The page shows these as //=> lines, in the form Node's REPL and console.log print them.
	show('recipes: test double, as the REPL prints it', [
		util.inspect(await getTitleAtUrl('https://shop.test/', {fetch: fakeFetch})),
		util.inspect((await getTitleAtUrl('https://shop.test/gone', {fetch: fakeFetch})).error.message),
	].join('\n'));
	return [
		await getTitleAtUrl('https://shop.test/', {fetch: fakeFetch}),
		brief(await getTitleAtUrl('https://shop.test/gone', {fetch: fakeFetch})),
	];
});

await capture('recipes: markdown link', async () => {
	async function markdownLink(url) {
		const {title} = await getTitleAtUrl(url);
		return `[${title ?? url}](${url})`;
	}

	return [await markdownLink(`${base}/docs`), await markdownLink(`${base}/no-title`)].join('\n');
});

await capture('recipes: keep the whole title', async () => {
	const response = await fetch(`${base}/docs`);
	return extractTitle(await response.text(), {clean: false});
});

show('recipes: shell loop', await new Promise(resolve => {
	const bin = path.join(pkgDir, binEntry).replaceAll('\\', '/');
	const script = [
		`get_title() { node "${bin}" "$@"; }`,
		`for url in ${base}/ ${base}/missing ${base}/docs; do`,
		'  if title=$(get_title "$url" 2>/dev/null); then',
		'    printf \'%s\\t%s\\n\' "$url" "$title"',
		'  else',
		'    printf \'%s\\t(no title)\\n\' "$url"',
		'  fi',
		'done',
	].join('\n');
	const child = spawn('bash', ['-c', script]);
	let out = '';
	child.stdout.on('data', c => {
		out += c;
	});
	child.stderr.on('data', c => {
		out += c;
	});
	child.on('close', code => {
		resolve(`exit ${code}\n${out}`);
	});
}));

// ===== Versions and upgrading: the old majors =====
if (process.env.V2) {
	await capture('v2: import 2.0.0', async () => {
		const old = await import(path.join(process.env.V2, 'node_modules', PACKAGE, 'index.js').replaceAll('\\', '/').replace(/^([A-Za-z]):/, 'file:///$1:'));
		return Object.keys(old);
	});
	await capture('v2: installed cheerio', async () => JSON.parse(readFileSync(path.join(process.env.V2, 'node_modules', 'cheerio', 'package.json'), 'utf8')).version);
}

if (process.env.V1) {
	const oldRequire = createRequire(path.join(process.env.V1, 'index.js'));
	const old = oldRequire(PACKAGE);
	await capture('v1: typeof export', async () => typeof old);
	await capture('v1: callback (title, error)', async () => new Promise(resolve => {
		old(`${base}/docs`, (title, error) => {
			resolve({title, error: error === undefined ? '<undefined>' : String(error)});
		});
	}));
	await capture('v1: heading page', async () => new Promise(resolve => {
		old(`${base}/heading-differs`, (title, error) => {
			resolve({title, error: error === undefined ? '<undefined>' : String(error)});
		});
	}));
	await capture('v1: 404', async () => new Promise(resolve => {
		old(`${base}/missing`, (title, error) => {
			resolve({title: title ?? '<undefined>', error: error === undefined ? '<undefined>' : String(error)});
		});
	}));
}

server.close();
show('requests the fixture server saw', seen.length);
