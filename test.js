import test from 'ava';
import getTitleAtUrl from './';

global.Promise = Promise;

var validUrl = 'http://www.google.com';
// var difficultUrl = 'http://www.yahoo.com';
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
  } catch (err) {
    t.pass();
  }
});

test.cb('Shouldn\'t work with a 404', function (t) {
  getTitleAtUrl(fourOhFourUrl, function (title, error) {
    // t.context.log = console.log;

    if (error) {
      t.pass();
    } else {
      t.fail();
    }
    t.end();
  });
});

test('Won\'t work without a callback', function (t) {
  try {
    getTitleAtUrl(validUrl);
  } catch (err) {
    t.pass();
  }
});

// test.cb('can handle Yahoo', function (t) {
//   getTitleAtUrl(difficultUrl, function (title) {
//     t.truthy(title);
//     t.end();
//   });
// });
