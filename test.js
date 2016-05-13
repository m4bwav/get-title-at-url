import test from 'ava';
import execa from 'execa';
import pkg from './package.json';
import getTitleAtUrl from './';

global.Promise = Promise;

test('support help shortcut', function (t) {
    getTitleAtUrl("http://www.google.com", function (title){
        t.assert(title === "Google");
        t.end();  
    })
});
