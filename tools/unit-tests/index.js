const { floss } = require('floss');
const path = require('path');

function done()
{
    /* eslint-disable-next-line no-console */
    console.log('Done?');
}

floss({
    path: path.join(__dirname, './test.js'),
    quiet: false,
}, done);