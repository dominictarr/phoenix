var open    = require('open');
var path    = require('path');
var cfg     = require('../lib/config');
var connect = require('../lib/backend');

exports.start = function(opts) {
  var homePort = opts.homeport || 65000
  var pubPort = (opts.pub) ? (opts.pubport || 80) : 0

  if (opts.daemon) {
    // Daemon-mode
    var argv = [''+pubPort, ''+homePort];
    if (opts.config)
      argv.push('--config'), argv.push(opts.config);
    var daemon = require("daemonize2").setup({
      main: "../http_server/daemon.js",
      name: "phoenix-server",
      pidfile: path.join(cfg.datadir, "./phoenix-server.pid"),
      argv: argv
    });
    daemon.start();
  } else {
    // FG mode
    require('../http_server/home').createServer(homePort, opts);
    console.log('Phoenix Home Server....listening privately on localhost:' + homePort);

    if (opts.pub) {
      require('../http_server/pub').createServer(pubPort, opts);
      console.log('Phoenix Pub Server.....listening publicly on localhost:' + pubPort);
    }
  }

  if (!opts.dontopen) {
    setTimeout(function() {
      open('http://localhost:' + homePort)
    }, 500)
  }
}

exports.stop = function(opts) {
  var daemon = require("daemonize2").setup({
    main: "../http_server/daemon.js",
    name: "phoenix-server",
    pidfile: path.join(cfg.datadir, "./phoenix-server.pid")
  });
  daemon.stop();
}
