var window = require('global/window')
var HashRouter = require('hash-router')
var Event = require('geval')
var mercury = require('mercury')

module.exports = EventRouter
function EventRouter() {
  var router = HashRouter()
  var delegator = mercury.Delegator()

  window.addEventListener('hashchange', router)
  delegator.addGlobalEventListener('click', function (ev) {
    // if internal hash link
    if (
      ev.target.nodeName === "A" &&
      ev.target.origin === window.location.origin &&
      ev.target.hash
    ) {
      router()
    }
  })

  return Event(function (emit) {
    router.on('hash', emit)
  })
}
