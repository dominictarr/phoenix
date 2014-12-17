var pull      = require('pull-stream')
var multicb   = require('multicb')
var apis      = require('./apis')
var localhost = require('./lib/localhost-ws')
var ssb       = localhost // :TODO: ssb should be a sub api
var self      = apis(ssb)

var gui = require('./gui')(ssb, self.feed, self.profiles, self.network)
gui.renderPage('loading')

function connectStreams() {
  ssb.whoami(function(err, user) {
    console.log('whoami', err, user)
    if (user) {
      self.feed.addInboxIndex(user.id)
      gui.setUserId(user.id)
    }

    // :TODO: only one log feed
    var done = multicb()
    pull(ssb.createLogStream(), self.feed.in(done()))
    pull(ssb.createLogStream(), self.profiles.in(done()))
    pull(ssb.createLogStream(), self.network.in(done()))
    done(function(err) {
      if (err)
        console.error(err)
      gui.renderPage('feed')
    })
  })
}

localhost.on('socket:connect', function() {
  connectStreams()
  gui.setConnectionStatus(true)
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