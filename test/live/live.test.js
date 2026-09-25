/*
Live smoke tests against real sites. Opt-in: they run under `npm run test:live` or with LIVE_TESTS=1, never in `npm test`, because a site changing its markup is not a bug in this package.
*/
import assert from 'node:assert/strict';
import process from 'node:process';
import {test} from 'node:test';
import {getTitleAtUrl} from '../../dist/index.mjs';

const isEnabled = process.env.LIVE_TESTS === '1' || process.env.npm_lifecycle_event === 'test:live';

const SITES = [
  ['https://example.com/', 'Example Domain'],
  // The two sites the 2.0.0 tests used.
  ['https://www.google.com/', 'Google'],
  ['https://www.yahoo.com/', 'Yahoo'],
];

for (const [url, expected] of SITES) {
  test(`live: ${url}`, {skip: isEnabled ? false : 'live tests are opt-in: npm run test:live, or LIVE_TESTS=1'}, async () => {
    const {title, error, status} = await getTitleAtUrl(url, {timeout: 20_000});
    assert.equal(error, undefined, error?.message);
    assert.equal(status, 200);
    assert.equal(title, expected);
  });
}
