'use strict';

var request = require('request');
var isUrl = require('is-url');
var articleTitle = require('article-title')
  ;

/**
 * Retrieves the title at url and uses the callback to return that title
 * @name getTitleAtUrl
 * @param {String} url - A url to a webpage to retrieve a title from.
 * @param {Function} [callback] - A callback which is called after the
 * title has been retrieved.  Invoked with (title, responseError)
 */
module.exports = function (url, callback) {
  if (!isUrl(url)) {
    throw new Error('Invalid url');
  }

  if (!callback) {
    throw new Error('Callback must be set to receive the title for the url.');
  }

  function requestResponseHandler(error, response, body) {
    var title;
    // console.log('start: ' + url);
    if (!error && response.statusCode === 200) {
      if (body) {
        // console.log('Response body length equals ' + body.length);
      } else {
        // console.log('empty response body');
      }

      title = articleTitle(body);
    } else if (!error && response.statusCode === 404) {
      error = '404';
    } else {
      // console.log('unexpected response code: ' + response.statusCode);
    }

    callback(title, error);
  }

  request(url, requestResponseHandler);
};
