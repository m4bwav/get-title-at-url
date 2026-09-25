import assert from 'node:assert/strict';
import {describe, test} from 'node:test';
import {builds} from '../helpers/builds.js';

// The runtime's windows-1252 decoder, as an independent reference, when it follows the Encoding Standard (Node 20's turns 0x80 to 0x9F into C1 controls).
const windows1252 = (() => {
  try {
    const decoder = new TextDecoder('windows-1252');
    return decoder.decode(Uint8Array.of(0x80)) === '€' ? decoder : undefined;
  } catch {
    return undefined;
  }
})();

for (const {name, lib: {extractTitle}} of builds) {
  describe(`extractTitle (${name} build)`, () => {
    describe('finding the title', () => {
      test('plain title', () => {
        assert.equal(extractTitle('<html><head><title>Hello World</title></head></html>'), 'Hello World');
      });

      test('uppercase tag and attributes on the tag', () => {
        assert.equal(extractTitle('<TITLE>Upper</TITLE>'), 'Upper');
        assert.equal(extractTitle('<title id="t" data-x="1">With Attributes</title>'), 'With Attributes');
      });

      test('newlines and runs of spaces collapse to one space', () => {
        assert.equal(extractTitle('<title>\n   Spread\t\tout \r\n  title  </title>'), 'Spread out title');
      });

      test('the first <title> wins', () => {
        assert.equal(extractTitle('<title>First</title><title>Second</title>'), 'First');
      });

      test('a <title> inside inline SVG is not the document title', () => {
        assert.equal(extractTitle('<body><svg viewBox="0 0 1 1"><title>Logo</title></svg><title>Real Title</title></body>'), 'Real Title');
        assert.equal(extractTitle('<body><SVG><title>Logo</title></SVG></body>'), undefined);
      });

      test('a <title> inside a comment, script, style or template is skipped', () => {
        assert.equal(extractTitle('<!-- <title>Commented</title> --><title>Real</title>'), 'Real');
        assert.equal(extractTitle('<script>document.write("<title>Scripted</title>")</script><title>Real</title>'), 'Real');
        assert.equal(extractTitle('<style>/* <title>Styled</title> */</style><title>Real</title>'), 'Real');
        assert.equal(extractTitle('<template><title>Template</title></template><title>Real</title>'), 'Real');
      });

      test('an element whose name only starts with "title" is not a title', () => {
        assert.equal(extractTitle('<titles>Nope</titles><title>Yes</title>'), 'Yes');
      });

      test('markup inside <title> is text', () => {
        assert.equal(extractTitle('<title>Bold <b>move</b></title>'), 'Bold <b>move</b>');
      });

      test('og:title, then twitter:title, when <title> is missing or empty', () => {
        assert.equal(extractTitle('<meta property="og:title" content="Open Graph"><meta name="twitter:title" content="Twitter">'), 'Open Graph');
        assert.equal(extractTitle('<meta name="twitter:title" content="Twitter">'), 'Twitter');
        assert.equal(extractTitle('<title>   </title><meta property="og:title" content="After Empty">'), 'After Empty');
        assert.equal(extractTitle('<title>Title Wins</title><meta property="og:title" content="Open Graph">'), 'Title Wins');
      });

      test('meta tags in any attribute order and quoting', () => {
        assert.equal(extractTitle('<meta content="Content First" property="og:title">'), 'Content First');
        assert.equal(extractTitle('<meta property=\'og:title\' content=\'Single Quotes\'>'), 'Single Quotes');
        assert.equal(extractTitle('<meta property=og:title content=Unquoted>'), 'Unquoted');
        assert.equal(extractTitle('<META PROPERTY="OG:TITLE" CONTENT="Shouting">'), 'Shouting');
        assert.equal(extractTitle('<meta property="og:title" content="a > b" />'), 'a > b');
        assert.equal(extractTitle('<meta name="og:title" content="Name Attribute">'), 'Name Attribute');
        assert.equal(extractTitle('<meta property="og:title" content="First Wins"><meta property="og:title" content="Second">'), 'First Wins');
        assert.equal(extractTitle('<meta property="og:title"><meta property="og:title" content="Has Content">'), 'Has Content');
        assert.equal(extractTitle('<meta property="og:title" content="Duplicate" content="Ignored">'), 'Duplicate');
      });

      test('no title at all gives undefined', () => {
        assert.equal(extractTitle(''), undefined);
        assert.equal(extractTitle('<html><head></head><body>Nothing</body></html>'), undefined);
        assert.equal(extractTitle('<title></title>'), undefined);
        assert.equal(extractTitle('<title>Unclosed'), undefined);
      });
    });

    describe('character references', () => {
      test('named, decimal and hexadecimal', () => {
        assert.equal(extractTitle('<title>Tom &amp; Jerry &#39;s &#x27;s caf&eacute; don&#8217;t &quot;q&quot; &lt;tag&gt;</title>'), 'Tom & Jerry \'s \'s café don’t "q" <tag>');
      });

      test('&nbsp; counts as a space', () => {
        assert.equal(extractTitle('<title>A&nbsp;&nbsp;B</title>'), 'A B');
      });

      test('every row of the Latin-1 table lines up with its code points', () => {
        const names = ['nbsp', 'macr', 'deg', 'iquest', 'Agrave', 'Iuml', 'ETH', 'szlig', 'agrave', 'iuml', 'eth', 'yuml'];
        const expected = [0xA0, 0xAF, 0xB0, 0xBF, 0xC0, 0xCF, 0xD0, 0xDF, 0xE0, 0xEF, 0xF0, 0xFF].map(code => String.fromCodePoint(code)).join('|');
        assert.equal(extractTitle(`<title>x${names.map(entity => `&${entity};`).join('|')}x</title>`, {clean: false}), `x${expected}x`.replace(' ', ' '));
      });

      test('entities outside Latin-1, including the uppercase aliases', () => {
        assert.equal(extractTitle('<title>&ldquo;Q&rdquo; &hellip; &mdash; &ndash; &bull; &trade; &euro; &AMP; &COPY; &Dagger; &OElig;</title>', {clean: false}), '“Q” … — – • ™ € & © ‡ Œ');
      });

      test('a named reference without its semicolon, or an unknown one, stays as written', () => {
        assert.equal(extractTitle('<title>AT&T Rock &amp Roll &bogus;</title>'), 'AT&T Rock &amp Roll &bogus;');
      });

      test('numeric references: no semicolon, out of range, surrogates, NUL', () => {
        assert.equal(extractTitle('<title>&#65&#x42;</title>'), 'AB');
        assert.equal(extractTitle('<title>a&#0;b&#x110000;c&#xD800;d&#99999999999999999999;e</title>'), 'a�b�c�d�e');
        assert.equal(extractTitle('<title>&#x1F600;</title>'), '😀');
      });

      test('&#128; to &#159; decode as windows-1252 characters, not C1 controls', () => {
        assert.equal(extractTitle('<title>&#128;&#130;&#147;&#148;&#150;&#151;&#153;&#159;</title>'), '€‚“”–—™Ÿ');
        assert.equal(extractTitle('<title>[&#129;&#141;&#143;&#144;&#157;]</title>'), '[\u{81}\u{8D}\u{8F}\u{90}\u{9D}]');
      });

      test('the whole 128 to 159 table matches a conformant windows-1252 decoder', {skip: windows1252 ? false : 'no conformant windows-1252 TextDecoder in this runtime'}, () => {
        for (let code = 0x80; code <= 0x9F; code++) {
          const expected = windows1252.decode(Uint8Array.of(code));
          assert.equal(extractTitle(`<title>[&#${code};]</title>`, {clean: false}), `[${expected}]`, `&#${code};`);
        }
      });
    });

    describe('cleaning the site name off', () => {
      test('og:site_name as a suffix', () => {
        assert.equal(extractTitle('<title>Post Title | Site Name</title><meta property="og:site_name" content="Site Name">'), 'Post Title');
        assert.equal(extractTitle('<title>A | B | Site</title><meta property="og:site_name" content="Site">'), 'A | B');
      });

      test('og:site_name as a prefix', () => {
        assert.equal(extractTitle('<title>GitHub - m4bwav/get-title-at-url: Get the title</title><meta property="og:site_name" content="GitHub">'), 'm4bwav/get-title-at-url: Get the title');
      });

      test('og:site_name matches without regard to case and entities', () => {
        assert.equal(extractTitle('<title>Post — THE SITE &amp; CO</title><meta property="og:site_name" content="The Site &amp; Co">'), 'Post');
      });

      test('og:site_name with regex characters in it', () => {
        assert.equal(extractTitle('<title>Post | C++ (Weekly)</title><meta property="og:site_name" content="C++ (Weekly)">'), 'Post');
      });

      test('og:site_name that is not in the title falls back to the separator rule', () => {
        assert.equal(extractTitle('<title>Story - Daily Paper</title><meta property="og:site_name" content="Other">'), 'Story');
      });

      test('a title that is only the site name stays', () => {
        assert.equal(extractTitle('<title>Google</title><meta property="og:site_name" content="Google">'), 'Google');
      });

      test('without og:site_name the first of two or more parts is kept', () => {
        assert.equal(extractTitle('<title>Post Title | Site</title>'), 'Post Title');
        assert.equal(extractTitle('<title>Yahoo | Mail, Weather, Search, Politics, News</title>'), 'Yahoo');
        assert.equal(extractTitle('<title>First - Second - Third</title>'), 'First');
      });

      test('every separator, with a space on each side', () => {
        for (const separator of ['|', '-', '–', '—', '·', '»', '::']) {
          assert.equal(extractTitle(`<title>Page Title ${separator} Site</title>`), 'Page Title', separator);
        }
      });

      test('hyphens and other separators without spaces never split', () => {
        assert.equal(extractTitle('<title>Node-API docs</title>'), 'Node-API docs');
        assert.equal(extractTitle('<title>Q&amp;A|Help</title>'), 'Q&A|Help');
      });

      test('a first part shorter than four characters keeps the whole title', () => {
        assert.equal(extractTitle('<title>FAQ | Acme</title>'), 'FAQ | Acme');
        assert.equal(extractTitle('<title>Home | Acme</title>'), 'Home');
      });

      test('clean: false returns the decoded title as a browser shows it', () => {
        assert.equal(extractTitle('<title>Post  &amp;  More | Site</title><meta property="og:site_name" content="Site">', {clean: false}), 'Post & More | Site');
      });
    });
  });
}
