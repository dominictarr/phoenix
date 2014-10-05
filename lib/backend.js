var http = require('http');
var prpc = require('phoenix-rpc');
var cfg  = require('./config');

module.exports = connect

function connect(cb) {
  // connect to the home server
  var req = http.request({ method: 'CONNECT', hostname: 'localhost', port: cfg.homeport, path: '/' })
  req.on('connect', function(res, conn, head) {
    // connection successful
    var clientstream = prpc.client()
    clientstream.pipe(conn).pipe(clientstream)
    clientstream.api.close = function() { clientstream.end(); conn.end() }
    cb(null, clientstream.api)
  });
  req.on('error', function(err) {
    if (err.code != 'ECONNREFUSED') return cb(err)

    // connection failed, create an in-process server
    var server = prpc.server(cfg)
    var clientstream = prpc.client()
    clientstream.pipe(server).pipe(clientstream)
    clientstream.api.close = function() { clientstream.end() }
    cb(null, clientstream.api)
  })
  req.setTimeout(3000, function() { req.abort() })
  req.end()
}