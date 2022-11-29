# get-title-at-url

[![npm package](https://nodei.co/npm/get-title-at-url.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/get-title-at-url/)

[![Build Status](https://img.shields.io/travis/m4bwav/get-title-at-url/master.svg)](https://travis-ci.org/m4bwav/get-title-at-url)
![npm](https://img.shields.io/npm/dt/get-title-at-url?style=plastic)
[![Dependency Status](https://img.shields.io/david/m4bwav/get-title-at-url.svg)](https://david-dm.org/m4bwav/get-title-at-url)
[![Coverage Status](https://img.shields.io/coveralls/m4bwav/get-title-at-url/master.svg)](https://coveralls.io/github/m4bwav/get-title-at-url?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/npm/get-title-at-url/badge.svg?style=flat-square)](https://snyk.io/test/npm/get-title-at-url)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![Gitter](https://badges.gitter.im/m4bwav/get-title-at-url.svg)](https://gitter.im/m4bwav/get-title-at-url?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)  
  

Npm package to retrieve the title at a given url.  Largely combines articleTitle with request.


## Installation

Installation is easiest through npm:

`npm install get-title-at-url --save`


## Usage

**get-title-at-url** can be included as a reference.

```
import getTitleAtUrl from 'get-title-at-url';

const {title} = await getTitleAtUrl(url);

console.log(title);

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

The getTitleAtUrl will return a promise that resolves to `{title, error}`.  `title` will be unset if `error` is present and vice versa.
The `error` will be whatever error request passes back, the title will be empty if there was an issue.
## License

MIT © [Mark Rogers](http://www.markdavidrogers.com)
