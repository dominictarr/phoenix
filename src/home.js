var pull      = require('pull-stream')
var apis      = require('./apis')
var localhost = require('./lib/localhost-ws')
var ssb       = localhost // :TODO: ssb should be a sub api
var self      = apis(ssb)

function connectStreams() {
  ssb.whoami(function(err, user) {
    console.log('whoami', err, user)
    if (user)
      self.feed.addInboxIndex(user.id)

    // :TODO: reduce to only one log stream
    var logerror = console.error.bind(console)
    pull(ssb.createLogStream({ live: true }), self.feed.in(logerror))
    pull(ssb.createLogStream({ live: true }), self.profiles.in(logerror))
    pull(ssb.createLogStream({ live: true }), self.network.in(logerror))
  })
}

var gui = require('./gui')(ssb, self.feed, self.profiles, self.network)

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