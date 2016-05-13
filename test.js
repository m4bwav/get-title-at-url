import test from 'ava';
import getTitleAtUrl from './';

global.Promise = Promise;

test.cb('support help shortcut', function (t) {
  getTitleAtUrl('http://www.google.com', function (title) {
    t.is(title, 'Google');
    t.end();
  });
});
