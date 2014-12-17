var muxrpc     = require('muxrpc')
var pull       = require('pull-stream')
var ws         = require('pull-ws-server')
var Serializer = require('pull-serializer')
var util       = require('./util')

var reconnectTimeout
var wsStream
var rpcapi = muxrpc(require('../mans/ssb'), {auth: 'async'}, serialize)({auth: auth})
connect()

function connect() {
  reconnectTimeout = null

  if (wsStream)
    rpcapi._emit('socket:reconnecting')

  wsStream = ws.connect({ host: 'localhost', port: 2000 })
  pull(wsStream, rpcapi.createStream(), wsStream)

  wsStream.socket.onopen = function() {
    console.log('localhost socket opened')
    util.getJson('/access.json', function(err, token) {
      rpcapi.auth(token, function(err) {
        if (err) {
          rpcapi._emit('socket:error', new Error('AuthFail'))
          console.error('local host socket failed auth', err)
        } else {
          rpcapi._emit('socket:connect')
          console.log('localhost socket authenticated')
        }
      })
    })
  }

  wsStream.socket.onclose = function() {
    rpcapi._emit('socket:error', new Error('Close'))
    console.error('localhost socket lost')
    if (!reconnectTimeout)
      reconnectTimeout = setTimeout(connect, 10*1000)
  }
}

function auth(req, cb) {
  cb(null, true)
}

function serialize (stream) {
  return Serializer(stream, JSON, {split: '\n\n'})
}

module.exports = rpcapi