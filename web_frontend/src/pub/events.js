var mercury = require('mercury')

var EventRouter = require('../lib/event-router')

module.exports = createEvents
function createEvents() {
  var events = mercury.input([
    // common buttons
    'showIntroToken',
    'toggleLayout'
  ])
  events.setRoute = EventRouter()
  return events
}
