# get-title-at-url

[![npm package](https://nodei.co/npm/get-title-at-url.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/get-title-at-url/)

[![Build Status](https://img.shields.io/travis/m4bwav/get-title-at-url/master.svg)](https://travis-ci.org/m4bwav/get-title-at-url)
[![Dependency Status](https://img.shields.io/david/m4bwav/get-title-at-url.svg)](https://david-dm.org/m4bwav/get-title-at-url)
[![Coverage Status](https://img.shields.io/coveralls/m4bwav/get-title-at-url/master.svg)](https://coveralls.io/github/m4bwav/get-title-at-url?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/npm/get-title-at-url/badge.svg?style=flat-square)](https://snyk.io/test/npm/get-title-at-url)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![Gitter](https://badges.gitter.im/m4bwav/get-title-at-url.svg)](https://gitter.im/m4bwav/get-title-at-url?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)  
  
[![NPM](https://nodei.co/npm-dl/get-title-at-url.png?months=3)](https://nodei.co/npm/get-title-at-url/)

Npm package to retrieve the title at a given url.  Largely combines articleTitle with request.


## Installation

Installation is easiest through npm:

`npm install get-title-at-url --save`


## Usage

**get-title-at-url** can be included as a reference.

```
var getTitleAtUrl = require('get-title-at-url');

getTitleAtUrl(url, function(title){
  console.log(title);
});
```

## CLI

```
$ npm install --global get-title-at-url
```

```
$ get-title-at-url --help

  Usage
    $ get-title-at-url "<url>"

  Example
    $ get-title-at-url "http://www.google.com"
```

The getTitleAtUrl will use the callback function with the following signature callback(title, requestError).
The requestError will be whatever error request passes back, the title will be empty if there was an issue.
## License

MIT © [Mark Rogers](http://www.markdavidrogers.com)
