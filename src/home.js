var pull      = require('pull-stream')
var multicb   = require('multicb')
var apis      = require('./apis')
var localhost = require('./lib/localhost-ws')
var ssb       = localhost // :TODO: ssb should be a sub api
var self      = apis(ssb)

var gui = require('./gui')(ssb, self.feed, self.profiles, self.network)

localhost.on('socket:connect', function() {
  gui.setConnectionStatus(true)

  // load session info
  ssb.whoami(function(err, user) {
    console.log('whoami', err, user)
    if (user) {
      self.feed.addInboxIndex(user.id)
      gui.setUserId(user.id)
    }
    // render the page
    gui.sync()
  })
})
localhost.on('socket:error', function(err) {
  gui.setConnectionStatus(false, 'Lost connection to server.')
})
localhost.on('socket:reconnecting', function(err) {
  gui.setConnectionStatus(false, 'Lost connection to server. Reconnecting...')
})

// DEBUG
window.PULL = pull
window.SSB = ssb
window.FEED = self.feed
window.PROFILES = self.profiles
window.NETWORK = self.network
window.GUI = gui