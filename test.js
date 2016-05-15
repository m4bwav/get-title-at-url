import test from 'ava';
import getTitleAtUrl from './';

global.Promise = Promise;

var validUrl = 'http://www.google.com';
var fourOhFourUrl = 'http://www.google.com/aa';

test.cb('support help shortcut', function (t) {
  getTitleAtUrl(validUrl, function (title) {
    t.is(title, 'Google');
    t.end();
  });
});

test('Won\'t work with an invalid url', function (t) {
  try {
    getTitleAtUrl('afewaefaefwf', function () { });
  } catch (exception) {
    t.pass();
  }
});

test('Shouldn\'t work with a 404', function (t) {
  getTitleAtUrl(fourOhFourUrl, function (title, error) {
    if (error) {
      t.pass();
    } else {
      t.fail();
    }
  });
});

test('Won\'t work without a callback', function (t) {
  try {
    getTitleAtUrl(validUrl);
  } catch (exception) {
    t.pass();
  }
});
