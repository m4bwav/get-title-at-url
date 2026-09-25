/**
@type {import('xo').FlatXoConfig}
*/
const xoConfig = [
  {
    // The type fixture imports the built package, so it only resolves after a build; the consumer fixtures type-check it against the installed tarball instead.
    ignores: ['ai-docs/**', 'test/consumers/types/**'],
  },
  {
    space: 2,
    rules: {
      // The `v` flag is a syntax error in Safari 16 and Chrome before 112, which would stop the library loading at all in those browsers; `u` works everywhere.
      'require-unicode-regexp': ['error', {requireFlag: 'u'}],
    },
  },
  {
    files: ['package.json'],
    rules: {
      // The shape below is the one publint and attw approved in every resolution mode (see the plan in ai-docs/plans): main, module and types stay for older resolvers, and the declaration files are found by sibling name, so no types or default conditions.
      'package-json/prefer-exports': 'off',
      'package-json/require-default-condition': 'off',
      'package-json/require-types-in-exports': 'off',
      // Npm always publishes package.json, whatever `files` says.
      'package-json/prefer-files-field': 'off',
      // Trusted publishing matches repository.url exactly, so it stays spelled out.
      'package-json/prefer-shorthand': 'off',
      // Deliberate pins: tsdown is pre-1.0 and pinned exactly; TypeScript stays on 6.0 until tsdown and xo declare 7.
      'package-json/dependency-version-range': 'off',
    },
  },
  {
    files: ['test/**/*.{js,ts}'],
    rules: {
      // The test scripts name their files, so helpers and fixtures can live under test/ as the plan lays out.
      'node-test/no-import-test-files': 'off',
      // Table-driven tests: an assertion per row of a fixed, non-empty table, often awaiting a request or a child process per row.
      'node-test/no-conditional-assertion': 'off',
      'no-await-in-loop': 'off',
      // Skips that depend on the runtime (a missing legacy encoding) or on opting in (live tests), never forgotten ones.
      'node-test/no-skip-test': 'off',
      // `(await getTitleAtUrl(url)).title` reads best inside an assertion.
      'unicorn/no-await-expression-member': 'off',
    },
  },
  {
    // CommonJS on purpose: this fixture proves require() works.
    files: ['test/consumers/cjs-node/**/*.js'],
    rules: {
      'unicorn/prefer-module': 'off',
      'unicorn/prefer-top-level-await': 'off',
    },
  },
  {
    // The fixture projects model consumers: some are CommonJS on purpose, and none needs engines.
    files: ['test/consumers/**/package.json'],
    rules: {
      'package-json/prefer-type-module': 'off',
      'package-json/require-engines': 'off',
    },
  },
];

export default xoConfig;
