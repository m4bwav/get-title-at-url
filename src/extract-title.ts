/*
HTML in, page title out, with no dependencies and nothing beyond the language itself, so it runs in Node, Bun, Deno, edge runtimes and browsers.

Where the title comes from, in order: the document's first `<title>` element, then `<meta property="og:title">`, then `<meta name="twitter:title">`. A `<title>` inside a comment, script, style, template or inline SVG is not the document's and is skipped.

The clean-up afterwards is adapted from the heuristic in article-title (MIT, Sindre Sorhus): drop the site name that pages add to their titles. Two differences: it only splits on separators with a space on each side, so hyphenated words ("Node-API docs") stay whole, and when the page declares `og:site_name` it removes exactly that name, as a suffix or a prefix, instead of guessing.
*/

export type ExtractTitleOptions = {
  /**
  Remove a site-name suffix or prefix, so "Post | Site" becomes "Post". Default `true`.
  With `false` the title comes back as a browser shows it: entities decoded, whitespace collapsed.
  */
  clean?: boolean;
};

/**
Comments and elements whose contents are never the document's title or metadata.
*/
const NOT_DOCUMENT_CONTENT = /<!--[\s\S]*?-->|<(?<tag>script|style|template|svg)(?=[\s/>])[^>]*>[\s\S]*?<\/\k<tag>\s*>/giu;

const COMMENT = /<!--[\s\S]*?-->/gu;

/**
The first `<title>` element. Its contents are text: entities are decoded, tags are not tags.
*/
const TITLE_ELEMENT = /<title(?=[\s/>])[^>]*>(?<text>[\s\S]*?)<\/title\s*>/iu;

/**
A `<meta>` tag and its attributes. Quoted values may contain `>`.
*/
const META_TAG = /<meta(?<attributes>(?:\s+[^\s"'/=>]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'<=>`]+))?)*)\s*\/?>/giu;

/**
One attribute: its name, then a double-quoted, single-quoted or unquoted value.
*/
const ATTRIBUTE = /(?<name>[^\s"'/=>]+)(?:\s*=\s*(?:"(?<double>[^"]*)"|'(?<single>[^']*)'|(?<bare>[^\s"'<=>`]+)))?/gu;

/**
A character reference: decimal, hexadecimal or named.
*/
const CHARACTER_REFERENCE = /&(?:#(?<decimal>\d+)|#x(?<hex>[\da-f]+)|(?<name>[a-z][\da-z]*));?/giu;

/**
The `charset` parameter of a media type such as `text/html; charset=utf-8`.
*/
const CHARSET_PARAMETER = /(?:^|;)\s*charset\s*=\s*(?:"(?<double>[^"]*)"|'(?<single>[^']*)'|(?<bare>[^\s"';]+))/iu;

/**
What pages put between their own title and the site's name. Matched only with a space on each side.
*/
const SEPARATORS = ['|', '-', '–', '—', '·', '»', '::'];

const SEPARATOR_PATTERN = ` (?:${SEPARATORS.map(separator => escapeRegExp(separator)).join('|')}) `;

const SEPARATOR = new RegExp(SEPARATOR_PATTERN, 'u');

/**
Without a declared site name, the part before the first separator is kept only if it is at least this long, so "Home | Site" gives "Home" but "FAQ | Site" stays whole.
*/
const MIN_TITLE_LENGTH = 4;

/**
The Latin-1 Supplement block, U+00A0 to U+00FF, in code point order: every named reference HTML defines for it.
*/
const LATIN1_ENTITY_NAMES = [
  'nbsp iexcl cent pound curren yen brvbar sect uml copy ordf laquo not shy reg macr', // U+00A0
  'deg plusmn sup2 sup3 acute micro para middot cedil sup1 ordm raquo frac14 frac12 frac34 iquest', // U+00B0
  'Agrave Aacute Acirc Atilde Auml Aring AElig Ccedil Egrave Eacute Ecirc Euml Igrave Iacute Icirc Iuml', // U+00C0
  'ETH Ntilde Ograve Oacute Ocirc Otilde Ouml times Oslash Ugrave Uacute Ucirc Uuml Yacute THORN szlig', // U+00D0
  'agrave aacute acirc atilde auml aring aelig ccedil egrave eacute ecirc euml igrave iacute icirc iuml', // U+00E0
  'eth ntilde ograve oacute ocirc otilde ouml divide oslash ugrave uacute ucirc uuml yacute thorn yuml', // U+00F0
].join(' ');

/**
Named references outside Latin-1 that turn up in titles (names are case-sensitive). If real pages need more of HTML's two thousand, the zero-dependency `entities` package is the fallback.
*/
const OTHER_ENTITIES: Array<[name: string, character: string]> = [
  ['amp', '&'],
  ['AMP', '&'],
  ['lt', '<'],
  ['LT', '<'],
  ['gt', '>'],
  ['GT', '>'],
  ['quot', '"'],
  ['QUOT', '"'],
  ['apos', '\''],
  ['COPY', '©'],
  ['REG', '®'],
  ['hellip', '…'],
  ['ndash', '–'],
  ['mdash', '—'],
  ['lsquo', '‘'],
  ['rsquo', '’'],
  ['sbquo', '‚'],
  ['ldquo', '“'],
  ['rdquo', '”'],
  ['bdquo', '„'],
  ['lsaquo', '‹'],
  ['rsaquo', '›'],
  ['bull', '•'],
  ['trade', '™'],
  ['TRADE', '™'],
  ['euro', '€'],
  ['dagger', '†'],
  ['Dagger', '‡'],
  ['permil', '‰'],
  ['prime', '′'],
  ['Prime', '″'],
  ['larr', '←'],
  ['rarr', '→'],
  ['harr', '↔'],
  ['hearts', '♥'],
  ['OElig', 'Œ'],
  ['oelig', 'œ'],
  ['Scaron', 'Š'],
  ['scaron', 'š'],
  ['Yuml', 'Ÿ'],
  ['fnof', 'ƒ'],
  ['circ', 'ˆ'],
  ['tilde', '˜'],
  ['ensp', ' '],
  ['emsp', ' '],
  ['thinsp', ' '],
  ['zwnj', '‌'],
  ['zwj', '‍'],
  ['lrm', '‎'],
  ['rlm', '‏'],
];

const NAMED_ENTITIES = new Map<string, string>([
  ...LATIN1_ENTITY_NAMES.split(' ').map((name, index): [string, string] => [name, String.fromCodePoint(0xA0 + index)]),
  ...OTHER_ENTITIES,
]);

/**
The windows-1252 characters for the bytes 0x80 to 0x9F, which HTML also uses for the numeric references 128 to 159 instead of C1 controls. Index: code minus 0x80.
*/
export const WINDOWS_1252_C1 = '€\u{81}‚ƒ„…†‡ˆ‰Š‹Œ\u{8D}Ž\u{8F}\u{90}‘’“”•–—˜™š›œ\u{9D}žŸ';

/**
Get the title of an HTML document.

Pure and synchronous: no network, no DOM, no runtime-specific APIs, so it works in any JavaScript runtime, including browsers and edge functions.

@param html - The document, or at least its `<head>`.
@param options - `clean: false` keeps a site-name suffix or prefix.
@returns The title, or `undefined` when the document has none.

@example
```
extractTitle('<title>Getting started | Acme Docs</title>');
//=> 'Getting started'
```
*/
export function extractTitle(html: string, options: ExtractTitleOptions = {}): string | undefined {
  const document = html.replaceAll(NOT_DOCUMENT_CONTENT, ' ');
  const meta = metaContent(document);
  const title = [TITLE_ELEMENT.exec(document)?.groups?.text, meta.get('og:title'), meta.get('twitter:title')]
    .map(candidate => normalize(candidate ?? ''))
    .find(candidate => candidate !== '');

  if (title === undefined || options.clean === false) {
    return title;
  }

  const siteName = meta.get('og:site_name');
  return withoutSiteName(title, siteName === undefined ? '' : normalize(siteName));
}

/**
The encoding a `<meta charset>` or `<meta http-equiv="Content-Type">` tag declares, if any.

For the HTML encoding pre-scan: pass the first 1024 bytes of the document decoded as Latin-1.
*/
export function metaCharset(html: string): string | undefined {
  for (const attributes of metaTags(html.replaceAll(COMMENT, ' '))) {
    const charset = attributes.get('charset')?.trim() ?? '';
    if (charset !== '') {
      return charset;
    }

    if (attributes.get('http-equiv')?.trim().toLowerCase() !== 'content-type') {
      continue;
    }

    const declared = charsetParameter(attributes.get('content') ?? '');
    if (declared !== undefined) {
      return declared;
    }
  }

  return undefined;
}

/**
The `charset` parameter of a `Content-Type` value, if it has one.
*/
export function charsetParameter(contentType: string): string | undefined {
  const groups = CHARSET_PARAMETER.exec(contentType)?.groups;
  const label = (groups?.double ?? groups?.single ?? groups?.bare ?? '').trim();
  return label === '' ? undefined : label;
}

function withoutSiteName(title: string, siteName: string): string {
  if (siteName !== '') {
    const name = escapeRegExp(siteName);
    const suffix = new RegExp(String.raw`^(?<rest>.*\S)${SEPARATOR_PATTERN}${name}$`, 'iu').exec(title)?.groups?.rest;
    if (suffix !== undefined) {
      return suffix;
    }

    const prefix = new RegExp(String.raw`^${name}${SEPARATOR_PATTERN}(?<rest>\S.*)$`, 'iu').exec(title)?.groups?.rest;
    if (prefix !== undefined) {
      return prefix;
    }
  }

  const [first = '', ...rest] = title.split(SEPARATOR);
  return rest.length > 0 && [...first].length >= MIN_TITLE_LENGTH ? first : title;
}

/**
Decode character references and collapse whitespace, as `document.title` does (non-breaking spaces count as spaces here).
*/
function normalize(text: string): string {
  return decodeCharacterReferences(text).replaceAll(/\s+/gu, ' ').trim();
}

function decodeCharacterReferences(text: string): string {
  return text.replaceAll(CHARACTER_REFERENCE, (reference: string, ...parameters: unknown[]) => {
    const {decimal, hex, name} = parameters.at(-1) as Record<'decimal' | 'hex' | 'name', string | undefined>;
    if (name !== undefined) {
      // A named reference needs its semicolon, so "AT&T" and "a=1&b=2" stay as written.
      return reference.endsWith(';') ? NAMED_ENTITIES.get(name) ?? reference : reference;
    }

    return characterFor(Number(decimal ?? `0x${hex ?? ''}`));
  });
}

function characterFor(code: number): string {
  if (code >= 0x80 && code <= 0x9F) {
    return WINDOWS_1252_C1.charAt(code - 0x80);
  }

  return code === 0 || code > 0x10_FF_FF || (code >= 0xD8_00 && code <= 0xDF_FF) ? '�' : String.fromCodePoint(code);
}

/**
The `content` of each `<meta property="...">` or `<meta name="...">`, keyed by the lowercased property or name; the first tag for a key wins.
*/
function metaContent(html: string): Map<string, string> {
  const content = new Map<string, string>();
  for (const attributes of metaTags(html)) {
    const value = attributes.get('content');
    if (value === undefined) {
      continue;
    }

    for (const key of [attributes.get('property'), attributes.get('name')]) {
      const normalizedKey = key?.trim().toLowerCase() ?? '';
      if (normalizedKey !== '' && !content.has(normalizedKey)) {
        content.set(normalizedKey, value);
      }
    }
  }

  return content;
}

function * metaTags(html: string): Generator<Map<string, string>> {
  for (const match of html.matchAll(META_TAG)) {
    yield parseAttributes(match.groups?.attributes ?? '');
  }
}

function parseAttributes(source: string): Map<string, string> {
  const attributes = new Map<string, string>();
  for (const match of source.matchAll(ATTRIBUTE)) {
    const {name = '', double, single, bare} = match.groups ?? {};
    const key = name.toLowerCase();
    // As in HTML, the first of two attributes with the same name wins.
    if (!attributes.has(key)) {
      attributes.set(key, double ?? single ?? bare ?? '');
    }
  }

  return attributes;
}

function escapeRegExp(text: string): string {
  return text.replaceAll(/[$()*+.?[\\\]^{|}]/gu, String.raw`\$&`);
}
