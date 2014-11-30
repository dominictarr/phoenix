var open    = require('open');
var path    = require('path');
var cfg     = require('../lib/config');
var connect = require('../lib/backend');

exports.start = function(opts) {
  var port = opts.port = opts.port || cfg.port

  require('../net_server/home').createServer(port, opts);
  console.log('Phoenix Home Server....listening privately on localhost:' + port);
}

exports.stop = function(opts) {
  var daemon = require("daemonize2").setup({
    main: "../net_server/daemon.js",
    name: "phoenix-server",
    pidfile: path.join(cfg.datadir, "./phoenix-server.pid")
  });
  daemon.stop();
}
