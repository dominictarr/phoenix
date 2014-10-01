var document = require('global/document')
var window = require('global/window')
var mercury = require('mercury')

var createEvents = require('./events.js')
var models = require('./models.js')
var render = require('./render.js')
var handlers = require('./handlers.js')
var backend = require('./lib/backend')

// :DEBUG:
// var client = backend.connect()
// client.api.getKeys(function(err, keys) {
//   console.log(keys)
// })

// init app
var state = createApp()
mercury.app(document.body, state, render)
handlers.setRoute(state, window.location.hash)

module.exports = createApp
function createApp() {
  var events = createEvents()
  var state = window.state = models.homeApp(events)
  wireUpEvents(state, events)
  return state
}

function wireUpEvents(state, events) {
  events.setRoute(handlers.setRoute.bind(null, state))
}