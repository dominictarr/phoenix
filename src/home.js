var pull = require('pull-streams')
var remoteRequire = require('remote-require')

remoteRequire.using(require('./mans'))
remoteRequire.connect('localhost')
remoteRequire.connect(require('./apis'), {as:'self'})

var ssb =      remoteRequire('localhost/ssb'),
var feed =     remoteRequire('self/phoenix-feed'),
var profiles = remoteRequire('self/phoenix-profiles')

// :TODO: reduce to only one log stream
pull(ssb.createLogStream(), feed.in())
pull(ssb.createLogStream(), profiles.in())

require('./gui')(ssb, feed, profiles)