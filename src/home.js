var muxrpc     = require('muxrpc')
var pull       = require('pull-stream')
var multicb    = require('multicb')
var Serializer = require('pull-serializer')
var auth       = require('./lib/ssb-domain-auth')

var ssb        = muxrpc(require('./mans/ssb'), false, serialize)()
var localhost  = require('ssb-channel').connect(ssb, 'localhost')
var self       = require('./apis')(ssb)

var gui = require('./gui')(ssb, self.feed, self.profiles, ssb.friends)

localhost.on('connect', function() {
  // authenticate the connection
  auth.getToken('localhost', function(err, token) {
    if (err) return localhost.close(), console.error('Token fetch failed', err)
    ssb.auth(token, function(err) {
      gui.setConnectionStatus(true)

      // load session info
      ssb.whoami(function(err, user) {
        // render the page
        if (user) {
          self.feed.addInboxIndex(user.id)
          gui.setUserId(user.id)
        }
        gui.sync()

        // new message watcher
        pull(ssb.createLogStream({ live: true, gt: Date.now() }), pull.drain(function(msg) {
          if (msg.value.author == user.id)
            return
          gui.setPendingMessages(gui.pendingMessages + 1)
        }))
      })
    })
  })
})
localhost.on('error', function(err) {
  // inform user and attempt a reconnect
  console.log('Connection Error', err)
  gui.setConnectionStatus(false, 'Lost connection to the host program. Please restart the host program. Trying again in 10 seconds.')
  localhost.reconnect()
})
localhost.on('reconnecting', function(err) {
  console.log('Attempting Reconnect')
  gui.setConnectionStatus(false, 'Lost connection to the host program. Reconnecting...')
})

function serialize (stream) {
  return Serializer(stream, JSON, {split: '\n\n'})
}

// DEBUG
window.PULL = pull
window.SSB = ssb
window.FEED = self.feed
window.PROFILES = self.profiles
window.NETWORK = self.network
window.GUI = gui