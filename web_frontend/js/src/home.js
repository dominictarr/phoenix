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

module.exports = createApp
function createApp() {
  var events = createEvents()


  var initState = {
    currentUserId: 'foo'
  }
  var state = window.state = models.homeApp(events, initState)

  // :DEBUG:
  var ms = [
    {
      type: 'init',
      timestamp: Date.now() - 100000,
      authorNickname: 'pfraze'
    },
    {
      type: 'profile',
      timestamp: Date.now() - 90000,
      authorNickname: 'pfraze',
      message: { nickname: 'pfraze' }
    },
    {
      type: 'text',
      timestamp: Date.now() - 50000,
      authorNickname: 'pfraze',
      message: { plain: 'Hello, world!' }
    },
    {
      type: 'init',
      timestamp: Date.now() - 10000,
      authorNickname: 'bob'
    }
  ]
  state.feed.push(models.message(ms[0]))
  state.feed.push(models.message(ms[1]))
  state.feed.push(models.message(ms[2]))
  state.feed.push(models.message(ms[3]))
  state.profiles.push(models.profile({
    id: 'foo',
    nickname: 'pfraze',
    feed: ms.slice(0,3)
  }))
  state.profiles.push(models.profile({
    id: 'bar',
    nickname: 'bob',
    feed: ms.slice(3)
  }))
  state.profileMap.set({ foo: 0, bar: 1 })
  state.servers.push(models.server({
    hostname: 'foo.com',
    port: 80
  }))
  state.servers.push(models.server({
    hostname: 'bar.com',
    port: 65000
  }))

  wireUpEvents(state, events)
  return state
}

function wireUpEvents(state, events) {
  events.setRoute(handlers.setRoute.bind(null, state))
}