var mercury = require('mercury')

var EventRouter = require('../lib/event-router')

module.exports = createEvents
function createEvents() {
  var events = mercury.input([
    // publish forms
    'updatePublishFormText',
    'setPublishFormText',
    'setPublishFormType',
    'submitPublishForm',
    'cancelPublishForm',

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
    'replyToMsg',
    'reactToMsg',
    'shareMsg'
  ])
  events.setRoute = EventRouter()
  return events
}
