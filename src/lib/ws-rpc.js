var muxrpc      = require('muxrpc')
var Serializer  = require('pull-serializer')
var pull        = require('pull-stream')
var toPull      = require('stream-to-pull-stream')
var WSStream    = require('websocket-stream')
var through     = require('through')
var util        = require('./util')

// :TODO:
// it would be much better to get the RPC API from scuttlebot
// but scuttlebot imports this module, so we cant import scuttlebot w/o a circular dependency
// until this is solved, the scuttlebot manifest and serializer are copied here:

function serialize (stream) {
  return Serializer(stream, JSON, {split: '\n\n'})
}

var manifest = {
  add: 'async',
  get: 'async',
  getPublicKey: 'async',
  getLatest: 'async',
  whoami: 'async',
  auth: 'async',
  getLocal: 'async',
  createFeedStream: 'source',
  createHistoryStream: 'source',
  createLogStream: 'source',
  messagesByType: 'source',
  messagesLinkedToMessage: 'source',
  messagesLinkedToFeed: 'source',
  messagesLinkedFromFeed: 'source',
  feedsLinkedToFeed: 'source',
  feedsLinkedFromFeed: 'source',
  followedUsers: 'source',
  phoenix: { getUserPages: 'async', useInvite: 'async' }
}

var api = exports.api = null
var onConnected

// establishes the server api connection
var connect = exports.connect = function(state, _onConnected) {
  if (api) return
  if (_onConnected)
    onConnected = _onConnected

  var conn = WSStream('ws://' + window.location.host + '/ws')
  conn.on('error', handleClientError.bind(null, state))
  conn.on('close', handleClientClose.bind(null, state))

  api = exports.api = muxrpc(manifest, null, serialize) ({})
  var clientStream = api.createStream()
  pull(clientStream, toPull.duplex(conn), clientStream)

  // :DEBUG:
  window.Buffer = Buffer
  window.rpcapi = api

  conn.on('connect', function () {
    state.conn.hasError.set(false)
    state.conn.explanation.set('')

    // authenticate
    util.getJson('/access.json', function(err, token) {
      api.auth(token, function(err) {
        if (onConnected) onConnected(err)
        if (err) {
          state.conn.hasError.set(true)
          state.conn.explanation.set('Failed to authenticate with the local server: ' + err.message)
          console.error('Failed to authenticate with backend', err)
          return
        }
      })
    })
  })
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
