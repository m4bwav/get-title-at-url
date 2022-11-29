import test from 'ava';
import getTitleAtUrl from './index.js';

global.Promise = Promise;

const validUrl = 'http://www.google.com';
const difficultUrl = 'https://www.yahoo.com';
const fourOhFourUrl = 'http://www.google.com/aa';

test('support help shortcut', async t => {
  const resultCallback = (title, error, response, body) => {
    if (error) {
      t.log(error);
      t.fail(`error: ${error}, response: ${JSON.stringify(response)}`);
      return;
    }

    console.error('first test result');
    if (!title) {
      t.fail(`Failed to retrieve a title for Google, body: ${body}, response: ${response}`);
    }

    t.is(title, 'Google');
  };

  const {title, error, body, response} = await getTitleAtUrl(validUrl);

  resultCallback(title, error, response, body);
});

test('Won\'t work with an invalid url', async t => {
  try {
    const {error} = await getTitleAtUrl('afewaefaefwf', () => {});

    if (error) {
      t.pass();
    } else {
      t.fail();
    }
  } catch {
    t.pass();
  }
});

test('Shouldn\'t work with a 404', async t => {
  const callback = (title, error) => {
    if (error) {
      t.pass();
    } else {
      t.fail();
    }
  };

  const {title, error} = await getTitleAtUrl(fourOhFourUrl);

  callback(title, error);
});

test('can handle Yahoo', async t => {
  const {title} = await getTitleAtUrl(difficultUrl);

  t.is(title, 'Yahoo');
});
