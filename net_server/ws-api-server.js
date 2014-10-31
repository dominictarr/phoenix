var WSStream = require('websocket-stream')
var pull     = require('pull-stream')
var toPull   = require('stream-to-pull-stream')
var backend  = require('../lib/backend')
var rpcapi   = require('../lib/rpcapi')

module.exports = function(opts) {
  return function(ws) {
    console.log('WS: new websocket client connected to home server')
    var conn = WSStream(ws)
    conn.on('error', function(err) { console.log('WS ERROR', err) })
    
    // :TODO: authentication? this listens on the localhost only, with CORS enabled

    // expose the owner-perms-level API
    var connStream = toPull.duplex(conn)
    pull(connStream, rpcapi.server(backend.ssb, backend.feed, 'owner').createStream(), connStream)
  }
}