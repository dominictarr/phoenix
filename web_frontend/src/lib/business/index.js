var pull        = require('pull-stream')
var util        = require('../../../../lib/util')
var wsrpc       = require('../ws-rpc')

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
  
  // followed profiles 
  // :TODO:
  // pull(toPull(wsrpc.api.following()), pull.drain(function (entry) { fetchProfile(state, entry.key) }))
}

// pulls down remote data for the session
exports.setupPubApp = function(state) {
  wsrpc.connect(state)
  // followed profiles :TODO:
  // pull(toPull(wsrpc.api.following()), pull.drain(function (entry) { fetchProfile(state, entry.key) }))
}

