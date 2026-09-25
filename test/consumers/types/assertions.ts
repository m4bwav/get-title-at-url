/*
Compile-time checks on the published declaration files. The runner copies this file into each TypeScript fixture as index.ts, so it is checked under that fixture's module and resolution settings (ESM and CommonJS under nodenext, bundler, node10).
*/
import getTitleAtUrl, {
  extractTitle,
  getTitleAtUrl as namedGetTitleAtUrl,
  type ExtractTitleOptions,
  type GetTitleError,
  type GetTitleErrorCode,
  type GetTitleOptions,
  type GetTitleResult,
} from 'get-title-at-url';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

// Compiles only when the argument is assignable to T, so expectType<string>(value) fails when value can be undefined.
declare function expectType<T>(value: T): void;

export type Checks = [
  // The default export is the named export.
  Expect<Equal<typeof getTitleAtUrl, typeof namedGetTitleAtUrl>>,
  Expect<Equal<Awaited<ReturnType<typeof getTitleAtUrl>>, GetTitleResult>>,
  Expect<Equal<ReturnType<typeof extractTitle>, string | undefined>>,
  Expect<Equal<GetTitleError['code'], GetTitleErrorCode>>,
  Expect<Equal<GetTitleErrorCode, 'INVALID_URL' | 'HTTP_ERROR' | 'NETWORK_ERROR' | 'TIMEOUT' | 'NOT_HTML' | 'NO_TITLE'>>,
];

// Every option is optional.
const noOptions: GetTitleOptions = {};
const noExtractOptions: ExtractTitleOptions = {};
const allOptions: GetTitleOptions = {
  timeout: 5000,
  signal: new AbortController().signal,
  headers: {'accept-language': 'en'},
  fetch,
  maxBytes: 65_536,
};

// The result narrows on `error`.
export async function checkNarrowing(url: string): Promise<void> {
  const result = await getTitleAtUrl(url, noOptions);
  if (result.error) {
    expectType<undefined>(result.title);
    expectType<GetTitleError>(result.error);
    expectType<Error>(result.error);
    expectType<GetTitleErrorCode>(result.error.code);
    expectType<number | undefined>(result.status);
  } else {
    expectType<string>(result.title);
    expectType<undefined>(result.error);
    expectType<number>(result.status);
  }

  expectType<string>(result.url);
}

export const extracted: string | undefined = extractTitle('<title>Types</title>', noExtractOptions);
export const withOptions: Promise<GetTitleResult> = namedGetTitleAtUrl(new URL('https://example.com/'), allOptions);
