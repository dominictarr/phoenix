var net    = require('net')
var pull   = require('pull-stream')
var toPull = require('stream-to-pull-stream')
var rpcapi = require('../lib/rpcapi')

module.exports = function(port, host) {
  var conn = net.connect(port, host)
  var client = rpcapi.client()
  var clientStream = client.createStream()
  pull(clientStream, toPull.duplex(conn), clientStream)
  client.socket = conn
  return client
}