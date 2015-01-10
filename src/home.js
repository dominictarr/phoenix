var muxrpc     = require('muxrpc')
var Serializer = require('pull-serializer')
var auth       = require('ssb-domain-auth')

var ssb        = muxrpc(require('./lib/ssb-manifest'), false, function (stream) { return Serializer(stream, JSON, {split: '\n\n'}) })()
var localhost  = require('ssb-channel').connect(ssb, 'localhost')
var api        = require('phoenix-api')(ssb)
var app        = require('./app')(ssb, api)

localhost.on('connect', function() {
  // authenticate the connection
  auth.getToken('localhost', function(err, token) {
    if (err) return localhost.close(), console.error('Token fetch failed', err)
    ssb.auth(token, function(err) {
      setConnectionStatus(true)
      app.api.startIndexing(function (err) {
        if (err) {
          console.error(err)          
          localhost.disconnect()
          return
        }
        refreshPage()
      })
    })
  })
})

localhost.on('error', function(err) {
  // inform user and attempt a reconnect
  console.log('Connection Error', err)
  setConnectionStatus(false, 'Lost connection to the host program. Please restart the host program. Trying again in 10 seconds.')
  localhost.reconnect()
})

localhost.on('reconnecting', function(err) {
  console.log('Attempting Reconnect')
  setConnectionStatus(false, 'Lost connection to the host program. Reconnecting...')
})


// DEBUG
window.PULL = require('pull-stream')
window.SSB = ssb
window.API = api
window.APP = app