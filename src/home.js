var pull = require('pull-streams')
var remoteRequire = require('remote-require')

remoteRequire.using(require('./mans'))
remoteRequire.import('localhost', 'ssb')
remoteRequire.import(require('./apis'), ['phoenix-feed', 'phoenix-profiles'])

var ssb =      remoteRequire('ssb'),
var feed =     remoteRequire('phoenix-feed'),
var profiles = remoteRequire('phoenix-profiles')

// :TODO: reduce to only one log stream
pull(ssb.createLogStream(), feed.in())
pull(ssb.createLogStream(), profiles.in())

require('./gui')(ssb, feed, profiles)