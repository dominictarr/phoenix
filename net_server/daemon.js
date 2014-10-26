var cfg     = require('../lib/config');

// Configure
var pubPort  = +process.argv[2];
var homePort = +process.argv[3];

var log = require('fs').createWriteStream(require('path').join(cfg.datadir, './phoenix-server.log'), {'flags': 'a'});
process.__defineGetter__('stdout', function() { return log; });
process.__defineGetter__('stderr', function() { return log; });
process.on('uncaughtException', onException);

// Log execution
console.log('');
console.log(process.argv);

// Start pub service
if (pubPort !== 0) {
  require('./pub').createServer(pubPort || 80);
  console.log('Phoenix Pub Server.....listening publicly on localhost:' + (pubPort || 80));
}

// Start home service
if (homePort !== 0) {
  var opts = { ws: (process.argv.indexOf('--ws') != -1) }
  require('./home').createServer(homePort || 65000, opts);
  console.log('Phoenix Home Server....listening privately on localhost:' + (homePort || 65000));
}

function onException(e) {
  console.log('Uncaught Exception: ' + e.toString());
}