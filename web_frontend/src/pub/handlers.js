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

exports.toggleLayout = function(state) {
  var curr = state.layout()
  if (curr[0][0] == 'main')
    state.layout.set([['side', 4], ['main', 8]])
  else
    state.layout.set([['main', 7], ['side', 5]])
}
