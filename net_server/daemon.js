var cfg = require('../lib/config')

// Configure
var port  = +process.argv[2]

var log = require('fs').createWriteStream(require('path').join(cfg.datadir, './phoenix-server.log'), {'flags': 'a'})
process.__defineGetter__('stdout', function() { return log; })
process.__defineGetter__('stderr', function() { return log; })
process.on('uncaughtException', onException)

// Log execution
console.log('')
console.log(process.argv)

// Start home service
if (port !== 0) {
  var opts = { ws: (process.argv.indexOf('--ws') != -1) }
  require('./home').createServer(port || 65000, opts)
  console.log('Phoenix Home Server....listening privately on localhost:' + (port || 65000))
}

function onException(e) {
  console.log('Uncaught Exception: ' + e.toString());
}