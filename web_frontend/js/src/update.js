var State = require("./state.js")

module.exports = {
  setRoute: setRoute
}

function setRoute(state, route) {
  state.route.set(route.substr(2) || 'feed')
}

