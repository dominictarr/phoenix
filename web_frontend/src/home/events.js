var window = require('global/window')
var HashRouter = require('hash-router')
var Event = require('geval')
var mercury = require('mercury')

module.exports = createEvents
function createEvents() {
  var events = mercury.input([
    // publish forms
    'updatePublishFormText',
    'setPublishFormText',
    'setPublishFormType',
    'submitPublishForm',
    'cancelPublishForm',
    'testPublishFormCode',

    // mention box behaviors
    'mentionBoxInput',
    'mentionBoxKeypress',
    'mentionBoxBlur',

    // network page
    'addServer',
    'removeServer',

    // common buttons
    'openMsg',
    'loadMore',
    'addFeed',
    'showIntroToken',
    'follow',
    'unfollow',
    'sync',

    // msg buttons
    'replyToMsg',
    'reactToMsg',
    'shareMsg',
    'runMsgGui'
  ])
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
