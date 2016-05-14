# get-title-at-url

[![npm package](https://nodei.co/npm/get-title-at-url.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/get-title-at-url/)

[![Build Status](https://travis-ci.org/m4bwav/get-title-at-url.svg?branch=master)](https://travis-ci.org/m4bwav/get-title-at-url)
[![Dependency Status](https://david-dm.org/m4bwav/get-title-at-url.svg)](https://david-dm.org/m4bwav/get-title-at-url)
[![Coverage Status](https://coveralls.io/repos/github/m4bwav/get-title-at-url/badge.svg?branch=master)](https://coveralls.io/github/m4bwav/get-title-at-url?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/npm/get-title-at-url/badge.svg?style=flat-square)](https://snyk.io/test/npm/get-title-at-url)
[![npm](https://img.shields.io/npm/v/npm.svg?maxAge=2592000)](https://www.npmjs.com/package/get-title-at-url)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![Gitter](https://badges.gitter.im/m4bwav/get-title-at-url.svg)](https://gitter.im/m4bwav/get-title-at-url?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

Npm package to retrieve the title at a given url.  Largely combines articleTitle with request.


## Installation

Installation is easiest through npm:

`npm install get-title-at-url --save`


## Usage

**get-title-at-url** can be included as reference.

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


## License

MIT © [Mark Rogers](http://www.markdavidrogers.com)