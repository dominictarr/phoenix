var muxrpc     = require('muxrpc')
var pull       = require('pull-stream')
var ws         = require('pull-ws-server')
var Serializer = require('pull-serializer')
var querystr   = require('querystring')
var util       = require('./util')

var HOST = 'localhost'
var PORT = 2000
var AUTH_PATH = '/auth.html'

module.exports = function (addr) {
  addr = addr || { host: HOST, port: PORT }
  var domain = 'http://'+(addr.host||HOST)+':'+(addr.port||PORT)
  var reconnectTimeout
  var wsStream
  var rpcapi = muxrpc(require('../mans/ssb'), {auth: 'async'}, serialize)({auth: auth})

  rpcapi.connect = function (opts) {
    opts = opts || {}
    opts.reconnect = opts.reconnect || 10000
    reconnectTimeout = null

    if (wsStream)
      rpcapi._emit('socket:reconnecting')

    wsStream = ws.connect(addr)
    pull(wsStream, rpcapi.createStream(), wsStream)

    wsStream.socket.onopen = function() {
      rpcapi._emit('socket:connect')
      util.getJson(domain+'/access.json', function(err, token) {
        rpcapi.auth(token, function(err) {
          if (err) rpcapi._emit('perms:error', err)
          else rpcapi._emit('perms:authed')
        })
      })
    }

    wsStream.socket.onclose = function() {
      rpcapi._emit('socket:error', new Error('Close'))
      if (!reconnectTimeout && opts.reconnect)
        reconnectTimeout = setTimeout(rpcapi.connect.bind(rpcapi, opts), opts.reconnect)
    }
  }

  rpcapi.deauth = function() {
    // :TODO:
  }

  rpcapi.getAuthUrl = function(opts) {
    opts = opts || {}
    opts.domain = window.location.protocol + '//' + window.location.host
    return domain+AUTH_PATH+'?'+querystr.stringify(opts)
  }

  rpcapi.openAuthPopup = function(opts) {
    opts = opts || {}
    opts.popup = 1
    window.open(this.getAuthUrl(opts), null)
  }

  // listen for messages from the auto popup
  window.addEventListener('message', function(e) {
    if (e.origin !== domain) return
    if (e.data == 'granted')
      rpcapi._emit('perms:granted')
    if (e.data == 'denied')
      rpcapi._emit('perms:denied')
  })

  return rpcapi
}

function auth(req, cb) {
  cb(null, false)
}

function serialize (stream) {
  return Serializer(stream, JSON, {split: '\n\n'})
}