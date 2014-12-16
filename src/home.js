var pull      = require('pull-streams')
var apis      = require('./apis')
var localhost = require('./util/localhost')
var self      = apis(localhost.ssb)

// :TODO: reduce to only one log stream
pull(localhost.ssb.createLogStream(), self.feed.in())
pull(localhost.ssb.createLogStream(), self.profiles.in())
pull(localhost.ssb.createLogStream(), self.network.in())

var gui = require('./gui')(localhost.ssb, self.feed, self.profiles, self.network)

localhost.on('socket:connect', function() {
  gui.setConnectionStatus(true)
})
localhost.on('socket:error', function(err) {
  gui.setConnectionStatus(false, 'Lost connection to server.')
})
localhost.on('socket:reconnecting', function(err) {
  gui.setConnectionStatus(false, 'Lost connection to server. Reconnecting...')
})