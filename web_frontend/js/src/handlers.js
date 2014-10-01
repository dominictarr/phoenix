var models = require('./models')

module.exports = {
  setRoute: setRoute
}

function setRoute(state, route) {
  route = route.substr(2) || 'feed'
  if (route.indexOf('profile/') === 0) {
    var profid = route.slice(8)
    state.fetchProfileFeed(profid)
  }
  else if (route == 'network') {
    state.fetchServers()
  }
  else {
    state.fetchFeed()
  }
  state.route.set(route)
}
