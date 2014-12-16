
var remoteRequire = require('remote-require')
remoteRequire.alias('self', require('./apis'))
remoteRequire.using(require('./mans'))

var ssb =      remoteRequire('localhost/ssb'),
var feed =     remoteRequire('self/phoenix-feed'),
var profiles = remoteRequire('self/phoenix-profiles')

var gui = require('./gui')
gui(ssb, feed, profiles)
