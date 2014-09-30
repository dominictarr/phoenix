var cfg     = require('../lib/config');

// Configure
var relayPort  = +process.argv[2];
var webguiPort = +process.argv[3];

var log = require('fs').createWriteStream(require('path').join(cfg.datadir, './phoenix-server.log'), {'flags': 'a'});
process.__defineGetter__('stdout', function() { return log; });
process.__defineGetter__('stderr', function() { return log; });
process.on('uncaughtException', onException);

// Log execution
console.log('');
console.log(process.argv);

// Start public service
if (relayPort !== 0) {
  require('./public').createServer(relayPort || 64000);
  console.log('Phoenix Pub Server.....listening publicly on localhost:' + (relayPort || 64000));
}

// Start webgui service
if (webguiPort !== 0) {
  var opts = { ws: (process.argv.indexOf('--ws') != -1) }
  require('./private').createServer(webguiPort || 65000, opts);
  console.log('Phoenix Home Server....listening privately on localhost:' + (webguiPort || 65000));
}

function onException(e) {
  console.log('Uncaught Exception: ' + e.toString());
}