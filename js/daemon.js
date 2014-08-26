require('./relay').createServer(64000);
console.log('Scuttlebutt relay.....listening publicly on localhost:64000');
require('./localhost').createServer(65000);
console.log('Web GUI...............listening privately on localhost:65000');