var open    = require('open');
var path    = require('path');
var cfg     = require('../lib/config');
var connect = require('../lib/backend');

exports.start = function(opts) {
  var port = opts.port = opts.port || cfg.port

  if (opts.daemon) {
    // Daemon-mode
    var argv = [''+port];
    if (opts.config)
      argv.push('--config'), argv.push(opts.config);
    var daemon = require("daemonize2").setup({
      main: "../net_server/daemon.js",
      name: "phoenix-server",
      pidfile: path.join(cfg.datadir, "./phoenix-server.pid"),
      argv: argv
    });
    daemon.start();
  } else {
    // FG mode
    require('../net_server/home').createServer(port, opts);
    console.log('Phoenix Home Server....listening privately on localhost:' + port);
  }
}

exports.stop = function(opts) {
  var daemon = require("daemonize2").setup({
    main: "../net_server/daemon.js",
    name: "phoenix-server",
    pidfile: path.join(cfg.datadir, "./phoenix-server.pid")
  });
  daemon.stop();
}
