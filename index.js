'use strict';

var request = require('request')
  , articleTitle = require('article-title')
  ;

module.exports = function(url, callback){
    request(url, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
		  var title = articleTitle(body)
		    ;
			
		callback(title) // Show the HTML for the Google homepage. 
	  }
	});  
};