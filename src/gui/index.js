var h = require('hyperscript')
var pull = require('pull-stream')
var multicb = require('multicb')
var com = require('./com')
var pages = require('./pages')
var handlers = require('./handlers')
var util = require('../lib/util')

var state = {
  unreadMessages: 0,
  
  msgs: [],
  profiles: {},
  nicknames: {},

  user: {
    id: null
  },
  page: {
    id: null,
    param: null
  }
}

// wire up toplevel event handlers
// - we map $HANDLER to events emitted by els with class of 'ev-$HANDLER'
function runHandler(el, e) {
  for (var k in handlers) {
    if (el.classList && el.classList.contains('ev-'+k))
      return handlers[k](state, el, e)
  }
}
document.body.addEventListener('click', function(e) {
  // find the link el
  var el = e.target
  while (el && el.tagName != 'A' && el.tagName != 'BUTTON')
    el = el.parentNode
  if (el)
    runHandler(el, e)
})
document.body.addEventListener('submit', function(e) {
  runHandler(e.target, e)
})

// init function
module.exports = function(ssb, feed, profiles, network) {
  var lastSync
  function syncState(cb) {
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
          state.msgs = r[0][1]
          state.profiles = r[1][1]
          for (var k in state.profiles)
            state.nicknames[k] = state.profiles[k].nickname || util.shortString(k)
        }
        cb(err)
      })
    })
  }

  function renderPage(id, param) {
    state.page.id = id
    state.page.param = param

    var page = pages[id]
    if (!page)
      page = pages.notfound

    syncState(function(err) {
      // :TODO: err handling
      page(state)
    })
  }

  return {
    state: state,
    setUserId: function(id) { state.user.id = id },
    setConnectionStatus: function (isConnected, message) {
      // :TODO:
    },
    renderPage: renderPage
  }
}