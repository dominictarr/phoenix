var h = require('hyperscript')
var pull = require('pull-stream')
var multicb = require('multicb')
var com = require('./com')
var pages = require('./pages')
var handlers = require('./handlers')
var router = require('./router')
var util = require('../lib/util')

// gui master state object
var state = {
  apis: {},

  unreadMessages: 0,
  
  msgs: [],
  msgsById: {},
  inbox: [],
  profiles: {},
  nicknames: {},
  peers: [],

  user: {
    id: null,
    following: []
  },
  page: {
    id: 'feed',
    param: null,
    renderMode: 'markdown',
    feedMode: 'threaded'
  }
}


// init func
module.exports = function(ssb, feed, profiles, network) {
  // connect the state object to the apis
  state.apis.ssb = ssb
  state.apis.feed = feed
  state.apis.profiles = profiles
  state.apis.network = network

  // wire up toplevel event handlers
  document.body.addEventListener('click', runHandler('click'))
  document.body.addEventListener('submit', runHandler('submit'))
  window.addEventListener('hashchange', function() { router(state), state.sync() })

  // run the router
  router(state)
  return state
}


var lastSync
state.sync = function(cb) {
  var ssb = this.apis.ssb
  var feed = this.apis.feed
  var profiles = this.apis.profiles
  var network = this.apis.network

  // sync the apis with ssb
  // :TODO: only one log feed
  // :TODO: setup once as a live stream
  var ts = Date.now()
  var done = multicb()
  pull(ssb.createLogStream({ gt: lastSync }), feed.in(done()))
  pull(ssb.createLogStream({ gt: lastSync }), profiles.in(done()))
  pull(ssb.createLogStream({ gt: lastSync }), network.in(done()))
  done(function(err) {
    if (err)
      console.error(err)
    lastSync = ts
      
    // pull data from the apis
    var done = multicb()
    pull(feed.all(), pull.collect(done()))
    pull(feed.inbox(state.user.id), pull.collect(done()))
    profiles.getAll(done())
    pull(network.pubPeers(), pull.collect(done()))
    pull(network.following(state.user.id), pull.collect(done()))
    done(function(err, r) {
      if (err)
        console.error(err)
      else {
        // update state
        state.msgs = r[0][1]
        state.msgs.forEach(function(msg) {
          state.msgsById[msg.key] = msg
        })
        state.inbox = r[1][1]
        state.profiles = r[2][1]
        for (var k in state.profiles)
          state.nicknames[k] = getNickname(state.profiles[k])
        state.peers = r[3][1]
        state.user.following = r[4][1]
      }
      
      // re-render the page
      var page = pages[state.page.id]
      if (!page)
        page = pages.notfound
      page(state)
    })
  })
}

state.setUserId = function(id) { state.user.id = id }
state.setConnectionStatus = function (isConnected, message) {
  // :TODO:
}

function getNickname(profile) {
  for (var i=profile.given.length-1; i >= 0; i--) {
    var given = profile.given[i]
    if (given.author == state.user.id && given.nickname)
      return given.nickname
  }
  return profile.nickname || util.shortString(profile.id)
}

// - we map $HANDLER to events emitted by els with class of 'ev-$HANDLER'
function runHandler(eventType) {
  return function(e) {
    // close any dropdowns
    if (eventType == 'click') {
      Array.prototype.forEach.call(document.querySelectorAll('.dropdown'), function(el) {
        el.classList.remove('open')
      })
    }

    var el = e.target
    while (el) {
      // check if this is a page navigation
      // (normally this is handled by onhashchange, but we need to watch for "on same page" clicks)
      if (eventType == 'click' && el.tagName == "A" && el.origin == window.location.origin && el.hash && el.hash == window.location.hash)
        return router(state), state.sync()
      // try handlers
      for (var k in handlers) {
        if (k.indexOf(eventType) === -1) continue // filter by evt type
        if (el.classList && el.classList.contains(k)) {
          e.preventDefault()
          e.stopPropagation()
          return handlers[k](state, el, e)
        }
      }
      // bubble up and keep looking
      el = el.parentNode
    }
  }
}
