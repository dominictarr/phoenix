var pull     = require('pull-stream')
var toPull   = require('stream-to-pull-stream')
var rpcapi   = require('../lib/rpcapi')

module.exports = function(backend) {
  return function(conn) {
    // expose the anon-perms-level API
    var connStream = toPull.duplex(conn)
    pull(connStream, rpcapi.server(backend.ssb, backend.feed, 'anon').createStream(), connStream)
  }
}