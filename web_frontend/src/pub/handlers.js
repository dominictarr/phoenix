var models = require('../lib/models')
var bus = require('../lib/business')

exports.setRoute = function(state, route) {
  route = route.substr(2) || 'feed'
  if (route.indexOf('profile/') === 0) {
    var profid = route.slice(8)
    bus.fetchProfileFeed(state, profid)
  }
  state.route.set(route)
}

exports.showIntroToken = function(state, data) {
  var t = JSON.stringify({id: data.id, relays: []}) // :TODO: relays
  prompt('Intro Token', t)
}