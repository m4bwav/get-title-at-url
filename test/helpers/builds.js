import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);

/**
Both published builds, so each suite runs in full against the ESM and the CommonJS output.
*/
export const builds = [
  {name: 'esm', lib: await import('../../dist/index.mjs')},
  {name: 'cjs', lib: require('../../dist/index.cjs')},
];

export const {version} = require('../../package.json');
