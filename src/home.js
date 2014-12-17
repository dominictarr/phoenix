var pull      = require('pull-stream')
var apis      = require('./apis')
var localhost = require('./lib/localhost-ws')
var ssb       = localhost // :TODO: ssb should be a sub api
var self      = apis(ssb)

// :TODO: reduce to only one log stream
var logerror = console.error.bind(console)
pull(ssb.createLogStream(), self.feed.in(logerror))
pull(ssb.createLogStream(), self.profiles.in(logerror))
pull(ssb.createLogStream(), self.network.in(logerror))

var gui = require('./gui')(ssb, self.feed, self.profiles, self.network)

localhost.on('socket:connect', function() {
  gui.setConnectionStatus(true)
})
localhost.on('socket:error', function(err) {
  gui.setConnectionStatus(false, 'Lost connection to server.')
})
localhost.on('socket:reconnecting', function(err) {
  gui.setConnectionStatus(false, 'Lost connection to server. Reconnecting...')
})