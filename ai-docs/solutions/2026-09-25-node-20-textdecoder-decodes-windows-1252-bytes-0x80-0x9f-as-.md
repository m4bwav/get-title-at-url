---
title: Node 20 TextDecoder decodes windows-1252 bytes 0x80-0x9F as C1 controls
kind: solution
status: active
date: 2026-09-25
verified: 2026-09-25
stale_after: 2026-12-24
tags: [nodejs, textdecoder, encoding, windows-1252, node20, charset]
aliases: [latin1 curly quotes, iso-8859-1 decoding, C1 controls, mojibake on Node 20]
summary: "read before touching charset decoding or dropping the package's own windows-1252 decoder: on Node 20 every windows-1252 label (latin1, iso-8859-1, us-ascii) turns bytes 0x80-0x9F into C1 controls; Node 22 and 24 are correct"
---

# Node 20 TextDecoder decodes windows-1252 bytes 0x80-0x9F as C1 controls

## Problem

On Node 20.20.2, `new TextDecoder('windows-1252')`, and every label that maps to it (`latin1`, `iso-8859-1`, `us-ascii`, `cp1252` and the rest), reports `encoding: 'windows-1252'` but decodes the bytes 0x80 to 0x9F as the C1 control characters U+0080 to U+009F instead of the windows-1252 characters (the euro sign, curly quotes, dashes, the trade mark sign). A fixture page declaring `charset=iso-8859-1` with curly quotes came back as `\x93Quoted\x94` on Node 20 and as `“Quoted”` on Node 22.23.3 and 24.18.0. The unit test that used the runtime decoder as its reference failed the other way round on Node 20: the library was right and the reference was wrong.

## Dead ends

- Suspected the fixture bytes: the same bytes decode correctly on Node 22 and 24.
- Checking the label does not reveal it: `new TextDecoder('latin1').encoding` is `'windows-1252'` on Node 20 as well.

## Fix

src/index.ts decodes the windows-1252 family itself. `WINDOWS_1252_LABELS` holds the 17 labels the Encoding Standard gives windows-1252; `decodeWindows1252` maps 0x80 to 0x9F through `WINDOWS_1252_C1` (the table the numeric character references in src/extract-title.ts already used) and every other byte to the same code point. The unit test uses the runtime decoder as a reference only when it decodes 0x80 as the euro sign, and a fixed-expectation test covers the table on every runtime.

## Verified by

```bash
node -e "console.log(process.version, [...new TextDecoder('windows-1252').decode(Uint8Array.of(0x80, 0x93, 0x94))].map(c => c.codePointAt(0).toString(16)).join(' '))"
```

Node 20.20.2 prints `80 93 94` (C1 controls); Node 22.23.3 and 24.18.0 print `20ac 201c 201d`. Since the fix, the functional test "charset from the Content-Type header: iso-8859-1, which means windows-1252, curly quotes included" passes on all three (2026-09-25, portable Node builds from nodejs.org/dist in the session scratchpad).

## Applies when

Node 20.x; checked on 20.20.2, the last Node 20 release. Node 22 and 24 are correct. Other runtimes were not checked, and the package no longer depends on them for this encoding family. The own decoder is runtime-independent, so it can stay after the Node floor moves to 22 in v4.

Related: builds on [../plans/2026-09-25-modernization-and-v3-release.md](../plans/2026-09-25-modernization-and-v3-release.md).
