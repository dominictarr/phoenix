var open    = require('open');
var path    = require('path');
var cfg     = require('../lib/config');
var connect = require('../lib/backend');

exports.start = function(opts) {
  if (opts.daemon) {
    // Daemon-mode
    var argv = ["0", opts.port || "65000"];
    if (opts.config)
      argv.push('--config'), argv.push(opts.config);
    if (opts.ws)
      argv.push('--ws')
    var daemon = require("daemonize2").setup({
      main: "../http_server/daemon.js",
      name: "phoenix-server",
      pidfile: path.join(cfg.datadir, "./phoenix-server.pid"),
      argv: argv
    });
    daemon.start();
  } else {
    // FG mode
    var webPort = opts.port || 65000;
    require('../http_server/private').createServer(webPort, opts);
    console.log('Phoenix Home Server....listening privately on localhost:' + webPort);
  }

  if (!opts.dontopen) {
    setTimeout(function() {
      open('http://localhost:' + (opts.port || 65000))
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
