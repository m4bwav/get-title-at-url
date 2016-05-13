'use strict';

var request = require('request');
var isUrl = require('is-url');
var articleTitle = require('article-title')
  ;

module.exports = function (url, callback) {
  if (!isUrl(url)) {
    throw new Error('Invalid url');
  }

  if (!callback) {
    throw new Error('Callback must be set to recieve the title for the url.');
  }

  request(url, function (error, response, body) {
    var title;
    if (!error && response.statusCode === 200) {
      title = articleTitle(body);
    }
    callback(title);
  });
};
