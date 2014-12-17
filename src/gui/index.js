var h = require('hyperscript')
var pull = require('pull-stream')
var multicb = require('multicb')
var com = require('./com')
var pages = require('./pages')
var handlers = require('./handlers')
var util = require('../lib/util')

var state = {
  apis: {},

  unreadMessages: 0,
  
  msgs: [],
  profiles: {},
  nicknames: {},

  user: {
    id: null
  },
  page: {
    id: 'feed',
    param: null
  }
}

// wire up toplevel event handlers
// - we map $HANDLER to events emitted by els with class of 'ev-$HANDLER'
function runHandler(e) {
  var el = e.target
  while (el) {
    for (var k in handlers) {
      if (el.classList && el.classList.contains('ev-'+k)) {
        e.preventDefault()
        e.stopPropagation()
        return handlers[k](state, el, e)
      }
    }
    // bubble up and keep looking
    el = el.parentNode
  }
}
document.body.addEventListener('click', runHandler)
document.body.addEventListener('submit', runHandler)

module.exports = function(ssb, feed, profiles, network) {
  state.apis.ssb = ssb
  state.apis.feed = feed
  state.apis.profiles = profiles
  state.apis.network = network

  var lastSync
  state.sync = function(cb) {
    // sync the apis with ssb
    // :TODO: only one log feed
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
      profiles.getAll(done())
      done(function(err, r) {
        if (err)
          console.error(err)
        else {
          // update state
          state.msgs = r[0][1]
          state.profiles = r[1][1]
          for (var k in state.profiles)
            state.nicknames[k] = state.profiles[k].nickname || util.shortString(k)
        }
        
        // re-render the page
        var page = pages[state.page.id]
        if (!page)
          page = pages.notfound
        page(state)
      })
    })
  }

  return {
    state: state,
    setUserId: function(id) { state.user.id = id },
    setConnectionStatus: function (isConnected, message) {
      // :TODO:
    }
  }
}