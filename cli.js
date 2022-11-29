#!/usr/bin/env node
import meow from 'meow';
import getTitleAtUrl from './index.js';

const cli = meow(`
    Usage
      $ get-title-at-url "<url>"
    
    Example
      $ get-title-at-url "http://www.theonion.com/"
  
`, {importMeta: import.meta});

const input = cli.input[0];

async function init(url) {
  const {title, error} = await getTitleAtUrl(url);

  if (error) {
    console.log(`error: ${error}`);
  } else {
    console.log(title);
  }
}

await init(input);
