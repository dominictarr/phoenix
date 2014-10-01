var window = require('global/window')
var HashRouter = require('hash-router')
var Event = require('geval')
var mercury = require('mercury')

module.exports = createInput
function createInput() {
  var events = mercury.input([ /* todo */ ])
  events.setRoute = EventRouter()
  return events
}

function EventRouter() {
  var router = HashRouter()
  window.addEventListener('hashchange', router)

  return Event(function (emit) {
    router.on('hash', emit)
  })
}
