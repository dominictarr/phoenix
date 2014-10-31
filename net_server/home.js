var net      = require('net')
var http     = require('http')
var WSServer = require('ws').Server
var backend  = require('../lib/backend')

function createServer(port, opts) {
  backend.setup()
  // setup periodic syncs :TODO:
  // require('../lib/background-sync')(backendClient, 1000 * 60 * 15)

  // create private HTTP server
  var httpServer = http.createServer(require('./http-server')(opts));
  var wss = new WSServer({server: httpServer, path: '/ws'})
  wss.on('connection', require('./ws-api-server')(opts))
  httpServer.listen(port, '::')

  // create public api server
  var apiServer = net.createServer(require('./api-server')(backend))
  apiServer.listen(+port+1) // :TODO: set port by config
  console.log('api server listening on', +port+1)

  function onExit() { /* :TODO: any cleanup? */ process.exit() }
  process.on('SIGINT', onExit).on('SIGTERM', onExit)
}

module.exports = {
  createServer: createServer
};