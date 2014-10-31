var pull     = require('pull-stream')
var toPull   = require('stream-to-pull-stream')
var rpcapi   = require('../lib/rpcapi')

module.exports = function(backend) {
  return function(conn) {
    var connStream = toPull.duplex(conn)
    pull(connStream, rpcapi.server(backend.ssb, backend.feed).createStream(), connStream)
  }
}