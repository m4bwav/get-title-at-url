/**
Why `getTitleAtUrl` could not return a title.

- `INVALID_URL`: the input is not an absolute `http:` or `https:` URL.
- `HTTP_ERROR`: the server answered with a status outside 200-299 (`status` is set).
- `NETWORK_ERROR`: no response arrived (DNS, TLS, refused connection, too many redirects, no `fetch` in the runtime).
- `TIMEOUT`: the request was aborted by the `timeout` option or by the caller's `signal`.
- `NOT_HTML`: the response's `Content-Type` is neither `text/html` nor `application/xhtml+xml`.
- `NO_TITLE`: the page has no usable title.
*/
export type GetTitleErrorCode =
  | 'INVALID_URL'
  | 'HTTP_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'NOT_HTML'
  | 'NO_TITLE';

export type GetTitleErrorDetails = {
  /**
  The HTTP status, when a response arrived.
  */
  status?: number;
  /**
  The URL the error is about: the final URL after redirects when a response arrived, else the requested one.
  */
  url?: string;
  /**
  The underlying error, if there was one.
  */
  cause?: unknown;
};

/**
The error `getTitleAtUrl` returns in its result (it never throws).
*/
export class GetTitleError extends Error {
  /**
  Why it failed, as a stable machine-readable code.
  */
  readonly code: GetTitleErrorCode;
  /**
  The HTTP status, when a response arrived.
  */
  readonly status?: number;
  /**
  The final URL after redirects when a response arrived, else the requested one.
  */
  readonly url?: string;

  constructor(code: GetTitleErrorCode, message: string, details: GetTitleErrorDetails = {}) {
    super(message, details.cause === undefined ? undefined : {cause: details.cause});
    this.name = 'GetTitleError';
    this.code = code;
    if (details.status !== undefined) {
      this.status = details.status;
    }

    if (details.url !== undefined) {
      this.url = details.url;
    }
  }

  /**
  Keeps `code` and `message` in `JSON.stringify` output (an error's own `message` is not enumerable).
  */
  // eslint-disable-next-line @typescript-eslint/naming-convention -- JSON.stringify calls a method by exactly this name
  toJSON(): {name: string; code: GetTitleErrorCode; message: string; status?: number; url?: string} {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      status: this.status,
      url: this.url,
    };
  }
}
