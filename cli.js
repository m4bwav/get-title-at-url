#!/usr/bin/env node
'use strict';
var meow = require('meow')
  ;

var getTitleAtUrl = require('./')
  ;

var cli = meow({
  help: [
    'Usage',
    '  $ get-title-at-url "<url>"',
    '',
    'Example',
    '  $ get-title-at-url "http://www.theonion.com/"'
  ]
});

var input = cli.input[0];

function init(url) {
  getTitleAtUrl(url, function (title) {
    console.log(title);
  });
}

init(input);
