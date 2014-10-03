var WSStream = require('websocket-stream')
var prpc = require('phoenix-rpc')
var through = require('through')

var existingClient
exports.connect = function() {
  if (existingClient) return existingClient

  var conn = WSStream('ws://' + window.location.host + '/ws')
  conn.on('error', function(e) { console.error('WS ERROR', e) })
  
  var client = prpc.client()
  client
    .pipe(through(function(chunk) { this.queue(toBuffer(chunk)) }))
    .pipe(conn)
    .pipe(client)
  existingClient = client
  return client
}

function toBuffer(chunk) {
  return (Buffer.isBuffer(chunk)) ? chunk : new Buffer(chunk)
}