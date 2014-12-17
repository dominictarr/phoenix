var h = require('hyperscript')
var pull = require('pull-stream')
var multicb = require('multicb')
var com = require('./com')
var pages = require('./pages')
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