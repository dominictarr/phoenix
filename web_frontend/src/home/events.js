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
    'showId',
    'follow',
    'unfollow',
    'sync',

    // feed buttons
    'toggleFilter',

    // msg buttons
    'replyToMsg',
    'reactToMsg',
    'shareMsg',
    'runMsgGui',

    // guipost behaviors
    'onGuipostReply'
  ])
  events.setRoute = EventRouter()
  return events
}
