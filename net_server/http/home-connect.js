var rpcapi   = require('../../lib/rpcapi')
var pull     = require('pull-stream')
var toPull   = require('stream-to-pull-stream')

module.exports = function(opts, backendClient, backend) {
  return function(req, conn, head) {
    // RPC-stream connection
    console.log('Received CONNECT')

    if (!backend) {
      // this is not the RPC server.... this shouldn't happen
      console.error('Unable to handle CONNECT - this is not the RPC server. Weird! Aborting')
      conn.close()
      return
    }

    // :TODO: authentication, perms

    conn.write('HTTP/1.1 200 Connection Established\r\n\r\n')
    var connStream = toPull.duplex(conn)
    pull(connStream, rpcapi.server(backend.ssb, backend.feed).createStream(), connStream)
  }
}