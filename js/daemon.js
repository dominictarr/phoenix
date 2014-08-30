//if (false) {
	// :TODO: do this when run as a daemon
	var log = require('fs').createWriteStream(require('path').join(__dirname, '../phoenixd.log'), {'flags': 'a'});
	process.__defineGetter__('stdout', function() { return log; });
	process.__defineGetter__('stderr', function() { return log; });
	process.on('uncaughtException', onException);
// }

var relayPort  = /*process.argv[2] ||*/ 64000;
var webguiPort = /*process.argv[3] ||*/ 65000;

require('./apps').buildCache({ tail: true });

if (relayPort != 0) {
	require('./relay').createServer(relayPort);
	console.log('Scuttlebutt relay.....listening publicly on localhost:' + relayPort);
}

if (webguiPort != 0) {
	require('./localhost').createServer(webguiPort);
	console.log('Web GUI...............listening privately on localhost:' + webguiPort);
}

function onException(e) {
	console.log('Uncaught Exception: ' + e.toString());
}