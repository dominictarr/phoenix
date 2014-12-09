var util = require('../util')
var ws   = require('../ws-rpc')

// loads the network nodes
var fetchServersQueue = util.queue().bind(null, 'servers')
var fetchServers =
exports.fetchServers = function(state, cb) {
  fetchServersQueue(cb, function(cbs) {
    // fetch nodes
    // :TODO: replace
    ws.api.getNodes(function(err, nodes) {
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
exports.followUser = function(state, id, cb) {
  if (!id) return cb(new Error('Invalid ID'))

  // publish follows link
  ws.api.add({ type: 'follow', feed: id, rel: 'follows' }, function(err) {
    if (err) return cb(err)

    // :TODO: replace
    // add their relays
    // if (!token.relays || token.relays.length === 0)        
      // return
    // ws.api.addNodes(token.relays, cb)

    // sync
    require('./index').syncView(state, cb)
  })
}

// stops following a feed
var unfollowUser =
exports.unfollowUser = function(state, id, cb) {
  if (!id) return cb(new Error('Invalid ID'))

  // publish unfollows link
  ws.api.add({ type: 'follow', feed: id, rel: 'unfollows' }, function(err) {
    if (err) return cb(err)
    
    // sync
    require('./index').syncView(state, cb)
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
  ws.api.addNode(addr[0], addr[1], function(err) {
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
  ws.api.delNode(addr[0], addr[1], function(err) {
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

// gets the latest local peer data
exports.fetchLocalPeers = function(state) {
  ws.api.getLocal(function(err, peers) {
    state.localPeers.splice(0, state.localPeers.getLength())
    ;(peers||[]).forEach(function (peer) {
      var profile = require('./index').getProfile(state, peer.id)
      if (profile)
        peer.nickname = profile.nickname()
      state.localPeers.push(peer)
    })
  })
}