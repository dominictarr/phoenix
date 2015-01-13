var muxrpc     = require('muxrpc')
var Serializer = require('pull-serializer')
var auth       = require('ssb-domain-auth')

var ssb        = muxrpc(require('./lib/ssb-manifest'), false, function (stream) { return Serializer(stream, JSON, {split: '\n\n'}) })()
var localhost  = require('ssb-channel').connect(ssb, 'localhost')
var app        = require('./app')(ssb)

localhost.on('connect', function() {
  // authenticate the connection
  auth.getToken('localhost', function(err, token) {
    if (err) return localhost.close(), console.error('Token fetch failed', err)
    ssb.auth(token, function(err) {
      app.setConnectionStatus(true)
      app.refreshPage()
    })
  })
})

localhost.on('error', function(err) {
  // inform user and attempt a reconnect
  console.log('Connection Error', err)
  app.setConnectionStatus(false, 'Lost connection to the host program. Please restart the host program. Trying again in 10 seconds.')
  localhost.reconnect()
})

localhost.on('reconnecting', function(err) {
  console.log('Attempting Reconnect')
  app.setConnectionStatus(false, 'Lost connection to the host program. Reconnecting...')
})


// DEBUG
window.PULL = require('pull-stream')
window.SSB = ssb
window.APP = app