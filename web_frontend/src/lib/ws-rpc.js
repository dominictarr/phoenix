var pull        = require('pull-stream')
var toPull      = require('stream-to-pull-stream')
var WSStream    = require('websocket-stream')
var through     = require('through')
var rpcapi      = require('../../../lib/rpcapi')

var api = exports.api = null

// establishes the server api connection
var connect = exports.connect = function(state) {
  if (api) return

  var conn = WSStream('ws://' + window.location.host + '/ws')
  conn.on('error', handleClientError.bind(null, state))
  conn.on('close', handleClientClose.bind(null, state))

  api = exports.api = rpcapi.client()
  var clientStream = api.createStream()
  pull(clientStream, toPull.duplex(conn), clientStream)

  // :DEBUG:
  window.Buffer = Buffer
  window.rpcapi = api

  // :DOUBLE-DEBUG:
  window.sync = function(host, port) {
    pull(
      api.sync(host, port),
      pull.drain(console.log.bind(console), console.log.bind(console))
    )
  }

  state.conn.hasError.set(false)
  state.conn.explanation.set('')
}

// server api connection error handler
function handleClientError(state, e) {
  console.error('Connection to phoenix server error', e)
}

// server api connection close handler
function handleClientClose(state, e) {
  console.error('Lost connection to phoenix server')
  state.conn.hasError.set(true)
  countdownToClientReconnect(state, 10000, 'Lost connection with the backend. Has the phoenix server been closed? Retrying $TIME')
}

// helper to do api reconnects on drop
function countdownToClientReconnect(state, dT, msg) {
  var interval
  var target = Date.now() + dT
  function step() {
    var remaining = target - Date.now()
    if (remaining <= 0) {
      // stop countdown
      clearInterval(interval)
      state.conn.explanation.set(msg.replace('$TIME', 'now...'))

      // reconnect
      api = exports.api = null
      connect(state)
    } else {
      // update message
      state.conn.explanation.set(msg.replace('$TIME', 'in ' + Math.round(remaining / 1000) + 's.'))
    }
  }
  interval = setInterval(step, 1000)
  step()
}