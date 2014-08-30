var log = require('fs').createWriteStream(require('path').join(__dirname, '../phoenix-relay.log'), {'flags': 'a'});
process.__defineGetter__('stdout', function() { return log; });
process.__defineGetter__('stderr', function() { return log; });
process.on('uncaughtException', onException);

// Log execution
console.log('');
console.log(process.argv);

var relayPort  = +process.argv[2];
var webguiPort = +process.argv[3];

require('./apps').buildCache({ tail: true });

if (relayPort !== 0) {
	require('./relay').createServer(relayPort || 64000);
	console.log('Scuttlebutt relay.....listening publicly on localhost:' + (relayPort || 64000));
}

if (webguiPort !== 0) {
	require('./localhost').createServer(webguiPort || 65000);
	console.log('Web GUI...............listening privately on localhost:' + (webguiPort || 65000));
}

function onException(e) {
	console.log('Uncaught Exception: ' + e.toString());
}