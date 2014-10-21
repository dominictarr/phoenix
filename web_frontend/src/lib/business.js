var pull        = require('pull-stream')
var toPull      = require('stream-to-pull-stream')
var multicb     = require('multicb')
var ssbDefaults = require('secure-scuttlebutt/defaults')
var msgpack     = require('msgpack-js')

var util        = require('../../../lib/util')
var wsrpc       = require('./ws-rpc')
var models      = require('./models')

function genMsgId(msg) {
  return ssbDefaults.hash(ssbDefaults.codec.encode(msg))
}
function convertMsgBuffers(msg) {
  msg.previous = new Buffer(msg.previous)
  msg.author = new Buffer(msg.author)
  msg.signature = new Buffer(msg.signature) 
}

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
  state.profileMap.set(pm)

  // add to nickname map
  var nm = state.nicknameMap()
  nm[id] = p.nickname
  state.nicknameMap.set(nm)

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
    // :TODO: replace
    // wsrpc.api.profile_getProfile(idBuf, function(err, profile) {
      // if (err && !err.notFound) return cb(err)
      profile = profile || {}
      
      // cache the profile
      profile.id = idBuf
      profile.idStr = idStr
      profile.nickname = idStr // :TEMP:
      profile = addProfile(state, profile)

      // pull into current user data
      if (profile.idStr == state.user.idStr())
        state.user.nickname.set(profile.nickname)

      // drain the queue
      cbs(null, profile)
    })
  // })
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
      wsrpc.api.createFeedStream(),
      pull.asyncMap(function(m, cb) {
        convertMsgBuffers(m)
        m.id = new Buffer('TODO' + m.sequence) // :TODO: replace genMsgId(m)
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
        var mm = state.messageMap()
        mm[m.idStr] = state.feed.getLength() - 1
        state.messageMap.set(mm)
        
        // index replies
        if (m.value.repliesTo)    indexReplies(state, m)
        if (m.value.rebroadcasts) indexRebroadcasts(state, m, mm)
        if (m.value.mentions)     indexMentions(state, m)
      }, function() {
        console.log('Im finished!')
        cbs(null, state.feed())
      })
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

function indexReplies(state, msg) {
  try {
    var id = util.toHexString(msg.value.repliesTo.$msg)
    if (id) {
      var sr = state.feedReplies()
      if (!sr[id]) sr[id] = []
      sr[id].push({ idStr: msg.idStr, type: msg.value.type })
      state.feedReplies.set(sr)
    }
  } catch(e) { console.warn('failed to index reply', e) }
}

function indexRebroadcasts(state, msg, msgMap) {
  try {
    var id = util.toHexString(msg.value.rebroadcasts.$msg)
    if (id) {
      var fr = state.feedRebroadcasts()
      if (!fr[id]) fr[id] = []
      fr[id].push({ idStr: msg.idStr })
      state.feedRebroadcasts.set(fr)

      // hide the rebroadcast if the original is already in the feed
      if (msgMap[id]) {
        msg.hidden.set(true)
      } else {
        // use this one to represent the original
        msgMap[id] = state.feed.getLength() - 1
      }
    }
  } catch(e) { console.warn('failed to index rebroadcast', e) }
}

function indexMentions(state, msg) {
  // look for mentions of the current user and create notifications for them
  var fr = state.feedRebroadcasts()
  var mentions = Array.isArray(msg.value.mentions) ? msg.value.mentions : [msg.value.mentions]
  for (var i=0; i < mentions.length; i++) {
    try {
      var mention = mentions[i]
      if (util.toHexString(mention.$feed) != state.user.idStr()) continue // not for current user
      if (msg.value.rebroadcasts && fr[util.toHexString(msg.value.rebroadcasts.$msg)]) continue // already handled
      state.notifications.push(models.notification({
        msgIdStr:       msg.idStr,
        authorNickname: msg.authorNickname,
        msgText:        msg.value.plain.split('\n')[0],
        timestamp:      msg.timestamp
      }))
    } catch(e) { console.warn('failed to index mention', e) }
  }
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
          wsrpc.api.createHistoryStream(util.toBuffer(profid), 0),
          pull.drain(function (m) {
            convertMsgBuffers(m)
            m.id = new Buffer('TODO' + m.sequence) // :TODO: replace genMsgId(m)
            m.idStr = util.toHexString(m.id)
            m.authorNickname = profile.nickname
            m = models.message(m)
            if (m.value.type == 'init') profile.joinDate.set(util.prettydate(new Date(m.timestamp), true))
            if (m) profile.feed.push(m)
          }, done())
        )
      }

      // fetch isFollowing state
      if (state.user && state.user.idStr() != idStr) {
        var cb2 = done()
        // :TODO: replace
        wsrpc.api.isFollowing(util.toBuffer(profid), function(err) {
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

// does pre-processing on text-based messages
var preprocessTextPost =
exports.preprocessTextPost = function(msg) {
  // extract any @-mentions
  var match
  var mentionRegex = /(\s|^)@([A-z0-9]+)/g;
  while ((match = mentionRegex.exec(msg.plain))) {
    var mention = match[2]
    if (!msg.mentions)
      msg.mentions = []
    try {
      msg.mentions.push({ $feed: util.toBuffer(mention), $rel: 'mentions' })
    } catch (e) { /* bad hash, ignore */ }
  }
  return msg
}

// posts to the feed
var publishText =
exports.publishText = function(state, text, cb) {
  if (!text.trim()) return cb(new Error('Can not post an empty string to the feed'))
  wsrpc.api.add(preprocessTextPost({type: 'text', plain: text}), cb)
}

// posts to the feed
var publishReply =
exports.publishReply = function(state, text, parent, cb) {
  parent = util.toBuffer(parent)
  if (!text.trim()) return cb(new Error('Can not post an empty string to the feed'))
  if (!parent) return cb(new Error('Must provide a parent message to the reply'))
  wsrpc.api.add(preprocessTextPost({type: 'text', plain: text, repliesTo: {$msg: parent, $rel: 'replies-to'}}), cb)
}

// posts to the feed
var publishAction =
exports.publishAction = function(state, text, cb) {
  if (!text.trim()) return cb(new Error('Can not post an empty string to the feed'))
  wsrpc.api.add(preprocessTextPost({type: 'act', plain: text}), cb)
}

// posts to the feed
var publishReaction =
exports.publishReaction = function(state, text, parent, cb) {
  parent = util.toBuffer(parent)
  if (!text.trim()) return cb(new Error('Can not post an empty string to the feed'))
  if (!parent) return cb(new Error('Must provide a parent message to the reply'))
  wsrpc.api.add(preprocessTextPost({type: 'act', plain: text, repliesTo: {$msg: parent, $rel: 'replies-to'}}), cb)
}

// posts to the feed
var publishGui =
exports.publishGui = function(state, text, cb) {
  if (!text.trim()) return cb(new Error('Can not post an empty string to the feed'))
  wsrpc.api.add({type: 'gui', html: text}, cb)
}

// posts to the feed
var publishGuiply =
exports.publishGuiply = function(state, text, parent, cb) {
  if (!text.trim()) return cb(new Error('Can not post an empty string to the feed'))
  if (!parent) return cb(new Error('Must provide a parent message to the reply'))
  wsrpc.api.add({type: 'gui', html: text, repliesTo: {$msg: parent, $rel: 'replies-to'}}, cb)
}

// posts a copy of the given message to the feed
var publishRebroadcast =
exports.publishRebroadcast = function(state, msg, cb) {
  if (!msg.value.rebroadcasts) {
    msg.value.rebroadcasts = {
      $rel: 'rebroadcasts',
      $msg: util.toBuffer(msg.id),
      $feed: util.toBuffer(msg.author),
      timestamp: msg.timestamp,
      timezone: msg.timezone
    }
  }
  wsrpc.api.add(msg.value, cb)
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
  // :TODO: replace
  wsrpc.api.follow(id, function(err) {
    if (err) return cb(err)

    // load the profile into the local cache, if possible
    fetchProfile(state, id, function(err, profile) {
      if (profile)
        profile.isFollowing.set(true)
    })

    // add their relays
    if (!token.relays || token.relays.length === 0)        
      return
    // :TODO: replace
    wsrpc.api.addNodes(token.relays, cb)
  })
}

// stops following a feed
var removeFeed =
exports.removeFeed = function(state, id, cb) {
  var id = util.toBuffer(id)
  // :TODO: replace
  wsrpc.api.unfollow(util.toBuffer(id), function(err) {
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