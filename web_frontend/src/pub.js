var document = require('global/document')
var window = require('global/window')
var mercury = require('mercury')

var models = require('./lib/models')
var bus = require('./lib/business')
var createEvents = require('./pub/events')
var render = require('./pub/render')
var handlers = require('./pub/handlers')

// init app
var state = createApp()
mercury.app(document.body, state, render)
handlers.setRoute(state, window.location.hash)

module.exports = createApp
function createApp() {
  var events = createEvents()
  var state = window.state = models.pubApp(events)
  bus.setupPubApp(state)
  wireUpEvents(state, events)
  return state
}

function wireUpEvents(state, events) {
  for (var k in handlers) {
    events[k](handlers[k].bind(null, state))
  }
}