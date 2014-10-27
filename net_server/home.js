var net      = require('net')
var http     = require('http')
var WSServer = require('ws').Server
var connect  = require('../lib/backend')

function createServer(port, opts) {
  connect(function (err, backendClient, backend) {
    if (err) return console.error(err);

    // setup periodic syncs :TODO:
    // require('../lib/background-sync')(backendClient, 1000 * 60 * 15)

    // create private HTTP server
    var httpServer = http.createServer(require('./http/home-request')(opts, backendClient, backend));
    var wss = new WSServer({server: httpServer, path: '/ws'})
    httpServer.on('connect', require('./http/home-connect')(opts, backendClient, backend))
    wss.on('connection', require('./http/home-ws')(opts, backendClient, backend))
    httpServer.listen(port, '::')

    // create public replication server
    var replServer = net.createServer(require('./repl-server')(opts, backendClient, backend))
    replServer.listen(+port+1) // :TODO: set port by config
    console.log('repl server listening on', +port+1)

    function onExit() { /* :TODO: any cleanup? */ process.exit() }
    process.on('SIGINT', onExit).on('SIGTERM', onExit)
  })
}

module.exports = {
  createServer: createServer
};