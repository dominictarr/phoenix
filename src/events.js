var mercury = require('mercury')

var EventRouter = require('./lib/event-router')

module.exports = createEvents
function createEvents() {
  var events = mercury.input([
    // publish forms
    'setPublishFormText',
    'setPublishFormType',
    'submitPublishForm',
    'dismissPublishFormError',
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
    'setUserNickname',
    'follow',
    'unfollow',
    'sync',

    // feed buttons
    'toggleFilter',
    'toggleUseLocalNetwork',

    // msg buttons
    'replyToMsg',
    'reactToMsg',
    'shareMsg',
    'runMsgGui',
    'toggleViewRaw',

    // guipost behaviors
    'refreshIframe',
    'onGuipostReply'
  ])
  events.setRoute = EventRouter()
  return events
}
