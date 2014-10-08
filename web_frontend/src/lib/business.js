var WSStream    = require('websocket-stream')
var prpc        = require('phoenix-rpc')
var through     = require('through')
var pull        = require('pull-stream')
var toPull      = require('stream-to-pull-stream')
var multicb     = require('multicb')
var ssbDefaults = require('secure-scuttlebutt/defaults')
var msgpack     = require('msgpack-js')

var util        = require('../../../lib/util')
var models      = require('./models')

var client = exports.client = null

function genMsgId(msg) {
  return ssbDefaults.hash(ssbDefaults.codec.encode(msg))
}
function convertMsgBuffers(msg) {
  msg.previous = new Buffer(msg.previous)
  msg.author = new Buffer(msg.author)
  msg.message = new Buffer(msg.message)
  msg.type = new Buffer(msg.type)
  msg.signature = new Buffer(msg.signature) 
}

// establishes the server api connection
function setupClient(state) {
  if (client) return

  var conn = WSStream('ws://' + window.location.host + '/ws')
  conn.on('error', handleClientError.bind(null, state))
  conn.on('close', handleClientClose.bind(null, state))

  client = exports.client = prpc.client()
  client.pipe(through(toBuffer)).pipe(conn).pipe(client)

  state.conn.hasError.set(false)
  state.conn.explanation.set('')
}

// server api connection error handler
function handleClientError(state, e) {
  console.error('Connection to phoenix server error', e)
}

// server api connection close handler
function handleClientClose(state, e) {
  console.error('Lost connection to phoenix server')
  state.conn.hasError.set(true)
  countdownToClientReconnect(state, 10000, 'Lost connection with the backend. Has the phoenix server been closed? Retrying $TIME')
}

// helper to do client reconnects on drop
function countdownToClientReconnect(state, dT, msg) {
  var interval
  var target = Date.now() + dT
  function step() {
    var remaining = target - Date.now()
    if (remaining <= 0) {
      // stop countdown
      clearInterval(interval)
      state.conn.explanation.set(msg.replace('$TIME', 'now...'))

      // reconnect
      client = exports.client = null
      setupClient(state)
    } else {
      // update message
      state.conn.explanation.set(msg.replace('$TIME', 'in ' + Math.round(remaining / 1000) + 's.'))
    }
  }
  interval = setInterval(step, 1000)
  step()
}

function toBuffer(chunk) {
  this.queue((Buffer.isBuffer(chunk)) ? chunk : new Buffer(chunk))
}

// pulls down remote data for the session
exports.setupHomeApp = function(state) {
  setupClient(state)
  // session
  client.api.getKeys(function(err, keys) {
    if (err) throw err
    state.user.id.set(util.toBuffer(keys.name))
    state.user.idStr.set(util.toHexString(keys.name))
    state.user.pubkey.set(util.toBuffer(keys.public))
    state.user.pubkeyStr.set(util.toHexString(keys.public))
  })
  client.api.getSyncState(function(err, syncState) {
    if (syncState && syncState.lastSync)
      state.lastSync.set(new Date(syncState.lastSync))
  })
  // followed profiles
  pull(toPull(client.api.following()), pull.drain(function (entry) { fetchProfile(state, entry.key) }))
}

// pulls down remote data for the session
exports.setupPubApp = function(state) {
  setupClient(state)
  // followed profiles
  pull(toPull(client.api.following()), pull.drain(function (entry) { fetchProfile(state, entry.key) }))
}

// adds a new profile
var addProfile =
exports.addProfile = function(state, p) {
  var pm = state.profileMap()
  var id = util.toHexString(p.id)
  if (id in pm) return state.profiles.get(pm[id])

  // add profile
  var i = state.profiles().length
  p = models.profile(p)
  state.profiles.push(p)

  // add index to the profile map
  pm[id] = i
  state.profileMap(pm)

  return p
}

// fetches a profile from the backend or cache
var fetchProfileQueue = util.queue()
var fetchProfile =
exports.fetchProfile = function(state, profid, cb) {
  var idStr = util.toHexString(profid)
  var idBuf = util.toBuffer(profid)
  cb = cb || function(){}
  var pm = state.profileMap()

  // load from cache
  var profi = pm[idStr]
  var profile = (typeof profi != 'undefined') ? state.profiles.get(profi) : undefined
  if (profile) return cb(null, profile)

  // try to load from backend
  fetchProfileQueue(idStr, cb, function(cbs) {
    client.api.profile_getProfile(idBuf, function(err, profile) {
      if (err && !err.notFound) return cb(err)
      profile = profile || {}
      
      // cache the profile
      profile.id = idBuf
      profile.idStr = idStr
      profile = addProfile(state, profile)

      // pull into current user data
      if (profile.idStr == state.user.idStr())
        state.user.nickname.set(profile.nickname)

      // drain the queue
      cbs(null, profile)
    })
  })
}

// loads the full feed
var fetchFeedQueue = util.queue().bind(null, 'feed')
var fetchFeed =
exports.fetchFeed = function(state, opts, cb) {
  if (!cb && typeof opts == 'function') {
    cb = opts
    opts = 0
  }
  if (!opts) opts = {}

  fetchFeedQueue(cb, function(cbs) {
    // do we have a local cache?
    if (opts.refresh && state.feed.getLength()) {
      state.feed.splice(0, state.feed.getLength()) // clear it out
    }

    // fetch feed stream
    // :TODO: start from where we currently are if there are already messages in the feed
    pull(
      toPull(client.api.createFeedStream()),
      pull.asyncMap(function(m, cb) {
        convertMsgBuffers(m)
        m.id = genMsgId(m)
        m.idStr = util.toHexString(m.id)

        fetchProfile(state, m.author, function(err, profile) {
          if (err) console.error('Error loading profile for message', err, m)
          else m.authorNickname = profile.nickname
          cb(null, m)
        })
      }),
      pull.drain(function (m) {
        m = models.message(m)
        if (messageIsCached(state, m)) return // :TODO: remove this once we only pull new messages

        // add to feed
        if (m) state.feed.unshift(m)
        
        // index replies
        if (m.message.repliesTo && m.message.repliesTo.$msg) {
          var id = util.toHexString(m.message.repliesTo.$msg)
          if (id) {
            if (m.type == 'text') {
              var sr = state.feedReplies()
              if (!sr[id]) sr[id] = []
              sr[id].push(m.idStr)
              state.feedReplies.set(sr)
            }
            if (m.type == 'act') {
              var sr = state.feedReacts()
              if (!sr[id]) sr[id] = []
              sr[id].push(m.idStr)
              state.feedReacts.set(sr)              
            }
          }
        }
      }, function() { cbs(null, state.feed()) })
    )
  })
}

// temporary helper to check if we already have the message in our feed cache
function messageIsCached(state, a) {
  if (!a) return false
  for (var i=0; i < state.feed.getLength(); i++) {
    var b = state.feed.get(i)
    if (util.toHexString(a.signature) == util.toHexString(b.signature)) {
      return true
    }
  }
  return false
}

// loads the profile's feed (from the backend or cache)
var fetchProfileFeedQueue = util.queue()
var fetchProfileFeed = 
exports.fetchProfileFeed = function(state, profid, cb) {
  var idStr = util.toHexString(profid)
  fetchProfileFeedQueue(idStr, cb, function(cbs) {
    fetchProfile(state, profid, function(err, profile) {
      if (err) return cb(err)
      if (!profile) return cb()
      var done = multicb()

      // fetch feed if not empty :TODO: just see if there are any new
      if (!profile.feed.getLength()) { 
        pull(
          toPull(client.api.createHistoryStream(util.toBuffer(profid), 0)),
          pull.drain(function (m) {
            convertMsgBuffers(m)
            m.id = genMsgId(m)
            m.idStr = util.toHexString(m.id)
            m.authorNickname = profile.nickname
            m = models.message(m)
            if (m.type == 'init') profile.joinDate.set(util.prettydate(new Date(m.timestamp), true))
            if (m) profile.feed.push(m)
          }, done())
        )
      }

      // fetch isFollowing state
      if (state.user && state.user.idStr() != idStr) {
        var cb2 = done()
        client.api.isFollowing(util.toBuffer(profid), function(err) {
          profile.isFollowing.set(!err)
          cb2()
        })
      }

      // done when ALL done
      done(cbs)
    })
  })
}

// loads the network nodes
var fetchServersQueue = util.queue().bind(null, 'servers')
var fetchServers =
exports.fetchServers = function(state, cb) {
  fetchServersQueue(cb, function(cbs) {
    // fetch nodes
    client.api.getNodes(function(err, nodes) {
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

// posts to the feed
var publishText =
exports.publishText = function(state, text, cb) {
  if (!text.trim()) return cb(new Error('Can not post an empty string to the feed'))
  client.api.addMessage('text', msgpack.encode({plain: text}), cb)
}

// posts to the feed
var publishReply =
exports.publishReply = function(state, text, parent, cb) {
  parent = util.toBuffer(parent)
  if (!text.trim()) return cb(new Error('Can not post an empty string to the feed'))
  if (!parent) return cb(new Error('Must provide a parent message to the reply'))
  client.api.addMessage('text', msgpack.encode({plain: text, repliesTo: {$msg: parent, $rel: 'replies-to'}}), cb)
}

// posts to the feed
var publishAction =
exports.publishAction = function(state, text, cb) {
  if (!text.trim()) return cb(new Error('Can not post an empty string to the feed'))
  client.api.addMessage('act', msgpack.encode({plain: text}), cb)
}

// posts to the feed
var publishReaction =
exports.publishReaction = function(state, text, parent, cb) {
  parent = util.toBuffer(parent)
  if (!text.trim()) return cb(new Error('Can not post an empty string to the feed'))
  if (!parent) return cb(new Error('Must provide a parent message to the reply'))
  client.api.addMessage('act', msgpack.encode({plain: text, repliesTo: {$msg: parent, $rel: 'replies-to'}}), cb)
}

// begins following a feed
var addFeed =
exports.addFeed = function(state, token, cb) {
  if (typeof token == 'string') {
    try { token = JSON.parse(token) }
    catch (e) { return cb(new Error('Bad intro token - must be valid JSON')) }
  }

  // start following the id
  var id = util.toBuffer(token.id)
  if (!id) return cb(new Error('Bad intro token - invalid ID'))
  client.api.follow(id, function(err) {
    if (err) return cb(err)

    // load the profile into the local cache, if possible
    fetchProfile(state, id, function(err, profile) {
      if (profile)
        profile.isFollowing.set(true)
    })

    // add their relays
    if (!token.relays || token.relays.length === 0)        
      return
    client.api.addNodes(token.relays, cb)
  })
}

// stops following a feed
var removeFeed =
exports.removeFeed = function(state, id, cb) {
  var id = util.toBuffer(id)
  client.api.unfollow(util.toBuffer(id), function(err) {
    if (err) return cb(err)
    fetchProfile(state, id, function(err, profile) {
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
    addr = addr.split(':')
  if (!addr[0]) return cb(new Error('Invalid address'))
  addr[1] = +addr[1] || 80
  
  client.api.addNode(addr[0], addr[1], function(err) {
    if (err) return cb(err)
    state.servers.push(models.server({ hostname: addr[0], port: addr[1] }))
  })
}

// removes a server from the network table
var removeServer =
exports.removeServer = function(state, addr, cb) {
  if (typeof addr == 'string')
    addr = addr.split(':')
  if (!addr[0]) return cb(new Error('Invalid address'))
  addr[1] = +addr[1] || 80

  client.api.delNode(addr[0], addr[1], function(err) {
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