var document = require('global/document')
var window = require('global/window')
var mercury = require('mercury')

var Input = require('./input.js')
var State = require('./state.js')
var Render = require('./render.js')
var Update = require('./update.js')
var backend = require('./lib/backend')

// :DEBUG:
// var client = backend.connect()
// client.api.getKeys(function(err, keys) {
//   console.log(keys)
// })

// init app
var state = createApp()
mercury.app(document.body, state, Render)

module.exports = createApp
function createApp() {
  var events = Input()
  var state = window.state = State.homeApp(events)
  wireUpEvents(state, events)
  return state
}

function wireUpEvents(state, events) {
  events.setRoute(Update.setRoute.bind(null, state))
}