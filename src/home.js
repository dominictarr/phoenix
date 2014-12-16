var pull = require('pull-streams')
var remoteRequire = require('remote-require')
remoteRequire.alias('self', require('./apis'))
remoteRequire.using(require('./mans'))

var ssb =      remoteRequire('localhost/ssb'),
var feed =     remoteRequire('self/phoenix-feed'),
var profiles = remoteRequire('self/phoenix-profiles')

// :TODO: reduce to only one log stream
pull(ssb.createLogStream(), feed.in())
pull(ssb.createLogStream(), profiles.in())

require('./gui')(ssb, feed, profiles)