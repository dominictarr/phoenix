var pull    = require('pull-stream')
var merge   = require('pull-merge')
var util    = require('../util')
var ws      = require('../ws-rpc')

function include(m) {
  for (var k in m)
    exports[k] = m[k]
}
include(require('./feed'))
include(require('./profiles'))
include(require('./publish'))
include(require('./network'))

// pulls down remote data for the session
exports.setupHomeApp = function(state) {
  ws.connect(state)

  // authorize using access-token injected by the server
  ws.api.auth(window.RPC_ACCESS_TOKEN, function(err) {
    if (err)
      return console.error('Failed to authenticate with backend', err)

    // session
    ws.api.whoami(function(err, data) {
      if (err) throw err
      state.user.id.set(data.id)
      state.user.pubkey.set(data.public)
    })
    
    // :TODO: add when getUserPages is reimplmeneted
    /*ws.api.getUserPages(function(err, pages) {
      state.userPages.set(pages)
    })*/

    // construct local state
    exports.syncView(state)
  })
}

// pulls down remote data for the session
exports.setupPubApp = function(state) {
  ws.connect(state)

  // construct local state
  exports.syncView(state)
}

// pulls down any new messages and constructs our materialized views
var lastFetchTS = 0
exports.syncView = function(state, cb) {
  cb = cb || function(err) { if (err) { throw err }}
  var newTS = Date.now()
  // process profiles first
  pull(
    ws.api.messagesByType({ type: 'profile', keys: true, gt: lastFetchTS }),
    pull.through(exports.processProfileMsg.bind(null, state)),
    pull.collect(function(err, profileMsgs) {
      if (err) return cb(err)

      // now process the feed
      pull(
        merge([
          pull.values(profileMsgs),
          ws.api.messagesByType({ type: 'init',   keys: true, gt: lastFetchTS }),
          ws.api.messagesByType({ type: 'post',   keys: true, gt: lastFetchTS }),
          ws.api.messagesByType({ type: 'follow', keys: true, gt: lastFetchTS }),
          ws.api.messagesByType({ type: 'pub',    keys: true, gt: lastFetchTS })
        ], msgstreamCmp),
        pull.drain(exports.processFeedMsg.bind(null, state), function(err) {
          if (err) return cb(err)
          var count = 0
          var accessed = state.accessTime()
          state.notifications.forEach(function (note) {
            if(note.timestamp > accessed)
              count ++
          })
          state.unreadMessages.set(count)
          lastFetchTS = newTS
          cb()
        })
      )
    })
  )
}

function msgstreamCmp(a, b) {
  if (a.value.timestamp < b.value.timestamp) return -1
  if (a.value.timestamp === b.value.timestamp) return 0
  return 1
}
