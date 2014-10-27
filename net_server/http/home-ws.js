var WSStream = require('websocket-stream')
var pull     = require('pull-stream')
var toPull   = require('stream-to-pull-stream')
var rpcapi   = require('../../lib/rpcapi')

module.exports = function(opts, backendClient, backend) {
  return function(ws) {
    console.log('WS: new websocket client connected to home server')
    var conn = WSStream(ws)
    conn.on('error', function(err) { console.log('WS ERROR', err) })

    if (!backend) {
      // this is not the RPC server.... this shouldn't happen
      console.error('Unable to handle websocket - this is not the RPC server. Weird! Aborting')
      conn.close()
      return
    }
    
    // :TODO: authentication, perms

    var connStream = toPull.duplex(conn)
    pull(connStream, rpcapi.server(backend.ssb, backend.feed).createStream(), connStream)
  }
}