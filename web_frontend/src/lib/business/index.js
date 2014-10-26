var pull  = require('pull-stream')
var merge = require('pull-merge')
var util  = require('../../../../lib/util')
var wsrpc = require('../ws-rpc')

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
  wsrpc.connect(state)
  // session
  wsrpc.api.whoami(function(err, data) {
    if (err) throw err
    state.user.id.set(util.toBuffer(data.id))
    state.user.idStr.set(util.toHexString(data.id))
    state.user.pubkey.set(util.toBuffer(data.public))
    state.user.pubkeyStr.set(util.toHexString(data.public))
  })

  // construct local state
  exports.syncView(state)
}

// pulls down remote data for the session
exports.setupPubApp = function(state) {
  wsrpc.connect(state)

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
    wsrpc.api.messagesByType({ type: 'profile', keys: true, gt: lastFetchTS }),
    pull.through(exports.processProfileMsg.bind(null, state)),
    pull.collect(function(err, profileMsgs) {
      if (err) return cb(err)

      // now process the feed
      pull(
        merge([
          pull.values(profileMsgs),
          wsrpc.api.messagesByType({ type: 'init',   keys: true, gt: lastFetchTS }),
          wsrpc.api.messagesByType({ type: 'post',   keys: true, gt: lastFetchTS }),
          wsrpc.api.messagesByType({ type: 'follow', keys: true, gt: lastFetchTS }),
          wsrpc.api.messagesByType({ type: 'pub',    keys: true, gt: lastFetchTS })
        ], msgstreamCmp),
        pull.drain(exports.processFeedMsg.bind(null, state), function(err) {
          if (err) return cb(err)
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