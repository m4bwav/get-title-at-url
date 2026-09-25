#!/usr/bin/env node
import {createRequire} from 'node:module';
import process from 'node:process';
import {parseArgs} from 'node:util';
import {getTitleAtUrl} from './index.ts';

const HELP = `
  Get the title of the web page at a URL.

  Usage
    $ get-title-at-url <url> [--timeout <ms>] [--json]

  Options
    --timeout <ms>  Give up after this many milliseconds (default 10000)
    --json          Print the whole result as JSON, even on failure
    --help, -h      Show this help
    --version, -v   Show the version

  Exit codes
    0  the title was printed
    1  the page could not be fetched or has no title
    2  bad usage

  Example
    $ get-title-at-url https://example.com/
    Example Domain
`;

async function main(argv: string[]): Promise<number> {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        timeout: {type: 'string'},
        json: {type: 'boolean'},
        help: {type: 'boolean', short: 'h'},
        version: {type: 'boolean', short: 'v'},
      },
    });
  } catch (error) {
    return usageError((error as Error).message);
  }

  const {values, positionals} = parsed;
  if (values.help) {
    console.log(HELP);
    return 0;
  }

  if (values.version) {
    // A relative require inside the package reaches package.json without going through the exports map.
    const {version} = createRequire(import.meta.url)('../package.json') as {version: string};
    console.log(version);
    return 0;
  }

  const [url] = positionals;
  if (url === undefined || positionals.length > 1) {
    return usageError(url === undefined ? 'a URL is required' : 'give one URL at a time');
  }

  let timeout: number | undefined;
  if (values.timeout !== undefined) {
    timeout = Number(values.timeout);
    if (!Number.isFinite(timeout) || timeout <= 0) {
      return usageError(`--timeout takes a positive number of milliseconds, not ${JSON.stringify(values.timeout)}`);
    }
  }

  const result = await getTitleAtUrl(url, {timeout});
  if (values.json) {
    console.log(JSON.stringify(result, undefined, 2));
  } else if (result.error) {
    console.error(`error: ${result.error.message}`);
  } else {
    console.log(result.title);
  }

  return result.error ? 1 : 0;
}

function usageError(message: string): number {
  console.error(`error: ${message}\n${HELP}`);
  return 2;
}

process.exitCode = await main(process.argv.slice(2));
