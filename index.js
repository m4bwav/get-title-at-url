'use strict';

var request = require('request')
  , isUrl = require('is-url')
  , articleTitle = require('article-title')
  ;

module.exports = function(url, callback){
	if(!isUrl(url)){
		throw new Error('Invalid url');
		return;
	}
	
    request(url, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
		  var title = articleTitle(body)
		    ;
			
		callback(title) // Show the HTML for the Google homepage. 
	  }
	});  
};