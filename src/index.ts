import {GetTitleError} from './errors.ts';
import {
  charsetParameter,
  extractTitle,
  metaCharset,
  WINDOWS_1252_C1,
} from './extract-title.ts';

export {extractTitle, type ExtractTitleOptions} from './extract-title.ts';
export {GetTitleError, type GetTitleErrorCode, type GetTitleErrorDetails} from './errors.ts';

/**
Replaced with the package version by the build; absent when the source is run directly.
*/
declare const PACKAGE_VERSION: string | undefined;

export type GetTitleOptions = {
  /**
  Milliseconds before the request is aborted. Default `10_000`. Values past 2^31 - 1 (about 24.8 days) are capped there.
  */
  timeout?: number;
  /**
  Abort the request from outside; combined with `timeout`. An aborted request fails with `TIMEOUT`.
  */
  signal?: AbortSignal;
  /**
  Extra request headers, merged over the defaults (`User-Agent` and `Accept`).
  */
  headers?: Record<string, string>;
  /**
  The `fetch` to use, for tests, proxies or custom agents. Default: the global `fetch`.
  */
  fetch?: typeof fetch;
  /**
  Stop reading the body after this many bytes; the title lives in `<head>`. Default 1 MiB (`1_048_576`).
  */
  maxBytes?: number;
};

export type GetTitleResult =
  | {
    /**
    The page's title, cleaned of a site-name suffix.
    */
    title: string;
    error?: undefined;
    /**
    The final URL, after redirects.
    */
    url: string;
    /**
    The HTTP status of the page.
    */
    status: number;
  }
  | {
    title?: undefined;
    /**
    Why there is no title.
    */
    error: GetTitleError;
    /**
    The final URL after redirects when a response arrived, else the requested URL.
    */
    url: string;
    /**
    The HTTP status, when a response arrived.
    */
    status?: number;
  };

const DEFAULT_TIMEOUT = 10_000;

/**
The longest delay timers accept.
*/
const MAX_TIMEOUT = 2_147_483_647;

const DEFAULT_MAX_BYTES = 1_048_576;

const ACCEPT = 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.1';

const USER_AGENT = `get-title-at-url/${typeof PACKAGE_VERSION === 'string' ? PACKAGE_VERSION : '0.0.0-development'} (+https://github.com/m4bwav/get-title-at-url)`;

const HTML_MEDIA_TYPES = new Set(['text/html', 'application/xhtml+xml']);

/**
The HTML encoding pre-scan reads this many bytes looking for a `<meta charset>`.
*/
const PRESCAN_BYTES = 1024;

/**
Every label the Encoding Standard gives windows-1252, which is also what HTML means by latin1, iso-8859-1 and us-ascii.
*/
const WINDOWS_1252_LABELS = new Set([
  'ansi_x3.4-1968',
  'ascii',
  'cp1252',
  'cp819',
  'csisolatin1',
  'ibm819',
  'iso-8859-1',
  'iso-ir-100',
  'iso8859-1',
  'iso88591',
  'iso_8859-1',
  'iso_8859-1:1987',
  'l1',
  'latin1',
  'us-ascii',
  'windows-1252',
  'x-cp1252',
]);

/**
Fetch a web page and get its title.

Never throws: every failure comes back as `error`, a `GetTitleError` with a `code`.

@param url - An absolute `http:` or `https:` URL.
@param options - Timeout, abort signal, extra headers, a custom `fetch`, and the body size limit.

@example
```
import getTitleAtUrl from 'get-title-at-url';

const {title, error} = await getTitleAtUrl('https://example.com/');
console.log(title ?? error.message);
//=> 'Example Domain'
```
*/
export async function getTitleAtUrl(url: string | URL, options: GetTitleOptions = {}): Promise<GetTitleResult> {
  const input = describe(url);
  const target = parseHttpUrl(url);
  if (target === undefined) {
    return failure(new GetTitleError('INVALID_URL', `Invalid URL ${JSON.stringify(input)}: expected an absolute http: or https: URL`, {url: input}));
  }

  try {
    return await fetchTitle(target, options ?? {});
  } catch (error) {
    // Only an options object that throws when read gets here; the promise still resolves, as documented.
    return failure(new GetTitleError('NETWORK_ERROR', `Request failed: ${describeError(error)}`, {url: target.href, cause: error}));
  }
}

export default getTitleAtUrl;

async function fetchTitle(target: URL, options: GetTitleOptions): Promise<GetTitleResult> {
  const timeout = toLimit(options.timeout, DEFAULT_TIMEOUT, MAX_TIMEOUT);
  // Called as a plain function, never as a method of `options`: a browser's fetch throws "Illegal invocation" when `this` is not the window.
  const fetchFunction = options.fetch ?? globalThis.fetch;
  if (typeof fetchFunction !== 'function') {
    return failure(new GetTitleError('NETWORK_ERROR', 'There is no fetch in this runtime; pass one as options.fetch', {url: target.href}));
  }

  let signal: AbortSignal | undefined;
  let response: Response | undefined;
  const failed = (error: unknown): GetTitleResult => {
    const details = {status: response?.status, url: urlOf(response, target), cause: error};
    if (signal?.aborted === true) {
      const message = options.signal?.aborted === true ? 'The request was aborted' : `Timed out after ${timeout} ms`;
      return failure(new GetTitleError('TIMEOUT', message, details));
    }

    return failure(new GetTitleError('NETWORK_ERROR', `Request failed: ${describeError(error)}`, details));
  };

  try {
    signal = anySignal([options.signal, AbortSignal.timeout(timeout)]);
    response = await fetchFunction(target.href, {headers: requestHeaders(options.headers), signal, redirect: 'follow'});
  } catch (error) {
    return failed(error);
  }

  const url = urlOf(response, target);
  const {status} = response;
  if (!response.ok) {
    discardBody(response);
    const message = response.statusText === '' ? `HTTP ${status}` : `HTTP ${status} ${response.statusText}`;
    return failure(new GetTitleError('HTTP_ERROR', message, {status, url}));
  }

  const contentType = response.headers.get('content-type') ?? undefined;
  const mediaType = contentType?.split(';', 1)[0]?.trim().toLowerCase() ?? '';
  if (mediaType !== '' && !HTML_MEDIA_TYPES.has(mediaType)) {
    discardBody(response);
    return failure(new GetTitleError('NOT_HTML', `Expected an HTML page, got ${mediaType}`, {status, url}));
  }

  let bytes: Uint8Array;
  try {
    bytes = await readBody(response, toLimit(options.maxBytes, DEFAULT_MAX_BYTES, Number.MAX_SAFE_INTEGER));
  } catch (error) {
    return failed(error);
  }

  const title = extractTitle(decode(bytes, sniffCharset(bytes, contentType)));
  return title === undefined ? failure(new GetTitleError('NO_TITLE', 'The page has no title', {status, url})) : {title, url, status};
}

/**
The URL if it is an absolute `http:` or `https:` URL.
*/
function parseHttpUrl(url: string | URL): URL | undefined {
  try {
    const target = new URL(url);
    return target.protocol === 'http:' || target.protocol === 'https:' ? target : undefined;
  } catch {
    return undefined;
  }
}

/**
The default headers with the caller's merged over them (header names are case-insensitive).
*/
function requestHeaders(extra: Record<string, string> = {}): Headers {
  const headers = new Headers({accept: ACCEPT, 'user-agent': USER_AGENT});
  for (const [name, value] of Object.entries(extra)) {
    headers.set(name, value);
  }

  return headers;
}

function failure(error: GetTitleError): GetTitleResult {
  const url = error.url ?? '';
  return error.status === undefined ? {error, url} : {error, url, status: error.status};
}

/**
The final URL after redirects. A `Response` built by hand (an injected `fetch`) has an empty `url`, so fall back to the requested one.
*/
function urlOf(response: Response | undefined, target: URL): string {
  return response === undefined || response.url === '' ? target.href : response.url;
}

/**
A whole number between 0 and `max`; `fallback` when `value` is not a number.
*/
function toLimit(value: number | undefined, fallback: number, max: number): number {
  return typeof value !== 'number' || Number.isNaN(value) ? fallback : Math.min(Math.max(Math.trunc(value), 0), max);
}

/**
`AbortSignal.any` where the runtime has it (Node 20.3+, current browsers), a forwarding controller where it does not.
*/
function anySignal(candidates: Array<AbortSignal | undefined>): AbortSignal {
  const signals = candidates.filter(signal => signal !== undefined);
  if (signals.length === 1 && signals[0] !== undefined) {
    return signals[0];
  }

  if (typeof AbortSignal.any === 'function') {
    return AbortSignal.any(signals);
  }

  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      break;
    }

    signal.addEventListener('abort', () => {
      controller.abort(signal.reason);
    }, {once: true});
  }

  return controller.signal;
}

async function readBody(response: Response, maxBytes: number): Promise<Uint8Array> {
  const body = response.body as ReadableStream<Uint8Array> | undefined;
  // Some fetch implementations (older polyfills) have no web stream to read from.
  if (typeof body?.getReader !== 'function') {
    const bytes = new Uint8Array(await response.arrayBuffer());
    return bytes.length > maxBytes ? bytes.subarray(0, maxBytes) : bytes;
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (received < maxBytes) {
    // eslint-disable-next-line no-await-in-loop -- a stream is read one chunk after another
    const {done, value} = await reader.read();
    if (done) {
      break;
    }

    chunks.push(value);
    received += value.byteLength;
  }

  if (received >= maxBytes) {
    // Stop the download: the rest of the page is not needed.
    reader.cancel().catch(() => undefined);
  }

  return concat(chunks, Math.min(received, maxBytes));
}

function concat(chunks: Uint8Array[], length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    const part = chunk.subarray(0, length - offset);
    bytes.set(part, offset);
    offset += part.byteLength;
  }

  return bytes;
}

/**
Let the connection go without reading a body nobody needs.
*/
function discardBody(response: Response): void {
  const body = response.body as ReadableStream<Uint8Array> | undefined;
  if (typeof body?.cancel === 'function') {
    body.cancel().catch(() => undefined);
  }
}

/**
The document's encoding, in the order HTML uses: byte order mark, `Content-Type` header, `<meta>` pre-scan, UTF-8.
*/
function sniffCharset(bytes: Uint8Array, contentType: string | undefined): string {
  if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
    return 'utf8';
  }

  if (bytes[0] === 0xFE && bytes[1] === 0xFF) {
    return 'utf-16be';
  }

  if (bytes[0] === 0xFF && bytes[1] === 0xFE) {
    return 'utf-16le';
  }

  const fromHeader = contentType === undefined ? undefined : charsetParameter(contentType);
  if (fromHeader !== undefined) {
    return fromHeader;
  }

  // Latin-1 by hand keeps every byte as one character without needing a legacy decoder.
  const fromMeta = metaCharset(String.fromCodePoint(...bytes.subarray(0, PRESCAN_BYTES)));
  // A `<meta>` found by an ASCII scan cannot be describing UTF-16, so HTML reads such a declaration as UTF-8.
  return fromMeta === undefined || /^utf-16/iu.test(fromMeta) ? 'utf8' : fromMeta;
}

function decode(bytes: Uint8Array, label: string): string {
  // Decoded here rather than by TextDecoder: Node 20 turns the bytes 0x80 to 0x9F into C1 controls instead of curly quotes, dashes and the euro sign.
  if (WINDOWS_1252_LABELS.has(label.trim().toLowerCase())) {
    return decodeWindows1252(bytes);
  }

  try {
    return new TextDecoder(label).decode(bytes);
  } catch {
    // An unknown label, or a runtime without the legacy encodings (Bun before 1.2.21).
    return new TextDecoder().decode(bytes);
  }
}

function decodeWindows1252(bytes: Uint8Array): string {
  let text = '';
  for (const byte of bytes) {
    text += byte >= 0x80 && byte <= 0x9F ? WINDOWS_1252_C1.charAt(byte - 0x80) : String.fromCodePoint(byte);
  }

  return text;
}

/**
The input as text for messages, safe for any value a JavaScript caller might pass.
*/
function describe(value: unknown): string {
  try {
    const text = String(value);
    return text.length > 200 ? `${text.slice(0, 200)}…` : text;
  } catch {
    return Object.prototype.toString.call(value);
  }
}

/**
"fetch failed (connect ECONNREFUSED 127.0.0.1:80)": the error's message plus the one its cause carries, which is where fetch puts the reason.
*/
function describeError(error: unknown): string {
  if (!(error instanceof Error)) {
    return describe(error);
  }

  const cause = error.cause instanceof Error ? error.cause.message : '';
  return cause !== '' && cause !== error.message ? `${error.message} (${cause})` : error.message;
}
