import isUrl from 'is-url';
import articleTitle from 'article-title';
import axios from 'axios';

function requestResponseHandler(error, response, body) {
  let title;

  if (!error && response.status === 200) {
    if (!body) {
      return {error: 'No body returned from url'};
    }

    title = articleTitle(body);
  } else if (!error && response.status === 404) {
    error = '404';
  } else {
    error = 'Unexpected response';
  }

  return {title, error, response, body};
}

/**
 * Retrieves the title at url and uses the callback to return that title
 * @name getTitleAtUrl
 * @param {String} url - A url to a webpage to retrieve a title from.
 * title has been retrieved.  Invoked with (title, responseError)
 */
export default async function getTitleAtUrl(url) {
  if (!isUrl(url)) {
    throw new Error('Invalid url');
  }

  try {
    const result = await axios.get(url);

    return requestResponseHandler(result.error, result, result.data);
  } catch (error) {
    return {error};
  }
}
