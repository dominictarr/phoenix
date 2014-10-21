var util        = require('../../../../lib/util')
var wsrpc       = require('../ws-rpc')

// loads the network nodes
var fetchServersQueue = util.queue().bind(null, 'servers')
var fetchServers =
exports.fetchServers = function(state, cb) {
  fetchServersQueue(cb, function(cbs) {
    // fetch nodes
    // :TODO: replace
    wsrpc.api.getNodes(function(err, nodes) {
      if (err) return cbs(err)

      // clear if not empty
      if (state.servers.getLength())
        state.servers.splice(0, state.servers.getLength())

      // add servers
      nodes.forEach(function(node) {
        state.servers.push(models.server({ hostname: node[0], port: node[1] }))
      })
      cbs(null, state.servers())
    })
  })
}

// begins following a feed
var followUser =
exports.followUser = function(state, token, cb) {
  if (typeof token == 'string') {
    try { token = JSON.parse(token) }
    catch (e) { return cb(new Error('Bad intro token - must be valid JSON')) }
  }

  // start following the id
  var id = util.toBuffer(token.id)
  if (!id) return cb(new Error('Bad intro token - invalid ID'))
  wsrpc.api.add({ type: 'network', $feed: id, $rel: 'follows' }, function(err) {
    if (err) return cb(err)

    // load the profile into the local cache, if possible
    profiles.getProfile(state, id, function(err, profile) {
      if (profile)
        profile.isFollowing.set(true)
    })

    // add their relays
    if (!token.relays || token.relays.length === 0)        
      return
    // :TODO: replace
    // wsrpc.api.addNodes(token.relays, cb)
  })
}

// stops following a feed
var unfollowUser =
exports.unfollowUser = function(state, id, cb) {
  var id = util.toBuffer(id)
  // :TODO: replace
  wsrpc.api.unfollow(util.toBuffer(id), function(err) {
    if (err) return cb(err)
    profiles.getProfile(state, id, function(err, profile) {
      if (profile)
        profile.isFollowing.set(false)
      cb()
    })
  })
}

// adds a server to the network table
var addServer =
exports.addServer = function(state, addr, cb) {
  if (typeof addr == 'string')
    addr = util.splitAddr(addr)
  if (!addr[0]) return cb(new Error('Invalid address'))
  addr[1] = +addr[1] || 80
  
  // :TODO: replace
  wsrpc.api.addNode(addr[0], addr[1], function(err) {
    if (err) return cb(err)
    state.servers.push(models.server({ hostname: addr[0], port: addr[1] }))
  })
}

// removes a server from the network table
var removeServer =
exports.removeServer = function(state, addr, cb) {
  if (typeof addr == 'string')
    addr = util.splitAddr(addr)
  if (!addr[0]) return cb(new Error('Invalid address'))
  addr[1] = +addr[1] || 80

  // :TODO: replace
  wsrpc.api.delNode(addr[0], addr[1], function(err) {
    if (err) return cb(err)

    // find and remove from the local cache
    for (var i=0; i < state.servers.getLength(); i++) {
      var s = state.servers.get(i)
      if (s.hostname == addr[0] && s.port == addr[1]) {
        state.servers.splice(i, 1)
        break
      }
    }
    cb()
  })
}