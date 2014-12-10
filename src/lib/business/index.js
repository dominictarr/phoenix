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
var fetchLocalPeersInterval
exports.setupHomeApp = function(state) {
  ws.connect(state, function(err) {
    if (err) return

    // session
    ws.api.whoami(function(err, data) {
      if (err) throw err
      state.user.id.set(data.id)
      state.user.pubkey.set(data.public)
      if (!exports.getProfile(state, data.id))
        exports.addProfile(state, data.id)
    })

    // lan peer refreshes (once every 30s)
    if (!fetchLocalPeersInterval)
      fetchLocalPeersInterval = setInterval(exports.fetchLocalPeers.bind(null, state), 30*1000)

    // new message watcher
    pull(ws.api.createLogStream({ live: true, gt: Date.now() }), pull.drain(function(msg) {
      if (msg.value.author == state.user.id())
        return
      state.syncMsgsWaiting.set(state.syncMsgsWaiting() + 1)
    }))

    // construct local state
    exports.syncView(state)
  })
}

// pulls down any new messages and constructs our materialized views
var lastFetchTS = 0
exports.syncView = function(state, cb) {
  cb = cb || function(err) { if (err) { throw err }}
  var newTS = Date.now()

  // reset pending sync messages
  state.syncMsgsWaiting.set(0)

  // process profiles first
  pull(
    ws.api.messagesByType({ type: 'profile', keys: true, gt: lastFetchTS }),
    pull.through(exports.processProfileMsg.bind(null, state)),
    pull.collect(function(err, profileMsgs) {
      if (err) return cb(err)

      // now process the feed
      pull(
        ws.api.createLogStream({ keys: true, gt: lastFetchTS }),
        pull.drain(exports.processFeedMsg.bind(null, state), function(err) {
          if (err) return cb(err)

          // count unread notes
          var count = 0
          var accessed = state.accessTime()
          state.notifications.forEach(function (note) {
            if(note.timestamp > accessed)
              count ++
          })
          state.unreadMessages.set(count)

          // update lan peers
          exports.fetchLocalPeers(state)

          // route to setup page if the user has no profile
          var prof = exports.getProfile(state, state.user.id())
          if (!prof.joinDate() || prof.nickname() == util.shortString(state.user.id()))
            window.location.hash = '#/setup'
          else if (window.location.hash == '#/setup')
            window.location.hash = '#'

          lastFetchTS = newTS
          cb()
        })
      )
    })
  )
}
