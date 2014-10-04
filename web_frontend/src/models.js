// var cuid = require('cuid')
var extend = require('xtend')
var mercury = require('mercury')
var pull = require('pull-stream')
var toPull = require('stream-to-pull-stream')
var msgpack = require('msgpack-js')
var multicb = require('multicb')

var backend = require('./lib/backend')
var util = require('../../lib/util')

module.exports = {
  homeApp: createHomeApp,
  message: createMessage,
  profile: createProfile,
  server: createServer
}

// Models
// ======

var defaults = {
  homeApp: {
    // gui state
    route: '',
    publishForm: {
      textFieldValue: '',
      textFieldRows: 1,
      preview: ''
    },

    // app data
    feed: [],
    profiles: [],
    profileMap: {},
    servers: [],
    user: {
      id: null,
      idStr: '',
      pubkey: null,
      pubkeyStr: ''
    },
    lastSync: '',
    isSyncing: false
  },
  message: {
    author: null,
    authorStr: '',
    message: null,
    previous: null,
    sequence: 0,
    signature: null,
    timestamp: 0,
    type: null,
    authorNickname: ''
  },
  profile: {
    id: null,
    idStr: '',
    nickname: '',
    joinDate: '',
    feed: [],
    isFollowing: false
  },
  server: {
    hostname: '',
    port: '',
    url: ''
  }
}

// Constructors
// ============

function createHomeApp(events, initialState) {
  var state = extend(defaults.homeApp, initialState)

  // create a map of profile ids to their indexes
  var profileMap = {}
  state.profiles.forEach(function(prof, i) {
    profileMap[prof.id.toString('hex')] = i
  })

  // create object
  var ha = mercury.struct({
    route:       mercury.value(state.route),
    publishForm: mercury.struct({
      textFieldValue: mercury.value(state.publishForm.textFieldValue),
      textFieldRows:  mercury.value(state.publishForm.textFieldRows),
      preview:        mercury.value(state.preview)
    }),
    events:      events,

    feed:        mercury.array(state.feed.map(createMessage)),
    profiles:    mercury.array(state.profiles.map(createProfile)),
    profileMap:  mercury.value(profileMap),
    servers:     mercury.array(state.servers.map(createServer)),
    user:        mercury.struct({
      id:        mercury.value(state.user.id),
      idStr:     mercury.value(state.user.idStr),
      pubkey:    mercury.value(state.user.pubkey),
      pubkeyStr: mercury.value(state.user.pubkeyStr)
    }),
    lastSync:   mercury.value(state.lastSync),
    isSyncing:  mercury.value(state.isSyncing)
  })

  // load data from the backend
  var client = backend.connect()
  ha.client = client
  // session
  client.api.getKeys(function(err, keys) {
    if (err) throw err
    ha.user.id.set(util.toBuffer(keys.name))
    ha.user.idStr.set(util.toHexString(keys.name))
    ha.user.pubkey.set(util.toBuffer(keys.public))
    ha.user.pubkeyStr.set(util.toHexString(keys.public))
  })
  client.api.getSyncState(function(err, state) {
    if (state && state.lastSync)
      ha.lastSync.set(new Date(state.lastSync))
  })
  // followed profiles
  pull(toPull(client.api.following()), pull.drain(function (entry) { ha.fetchProfile(entry.key) }))

  // adds a new profile
  function addProfile(p) {
    var pm = ha.profileMap()
    var id = util.toHexString(p.id)
    if (id in pm) return ha.profiles.get(pm[id])

    // add profile
    var i = ha.profiles().length
    p = createProfile(p)
    ha.profiles.push(p)

    // add index to the profile map
    pm[id] = i
    ha.profileMap(pm)

    return p
  }

  // fetches a profile from the backend or cache
  var fetchProfileQueue = util.queue()
  ha.fetchProfile = function(profid, cb) {
    var idStr = util.toHexString(profid)
    var idBuf = util.toBuffer(profid)
    cb = cb || function(){}
    var pm = ha.profileMap()

    // load from cache
    var profi = pm[idStr]
    var profile = (typeof profi != 'undefined') ? this.profiles.get(profi) : undefined
    if (profile) return cb(null, profile)

    // try to load from backend
    fetchProfileQueue(idStr, cb, function(cbs) {
      client.api.profile_getProfile(idBuf, function(err, profile) {
        if (err && !err.notFound) return cb(err)
        profile = profile || {}
        
        // cache the profile
        profile.id = idBuf
        profile.idStr = idStr
        profile = addProfile(profile)

        // drain the queue
        cbs(null, profile)
      })
    })
  }

  // loads the full feed
  var fetchFeedQueue = util.queue().bind(null, 'feed')
  ha.fetchFeed = function(opts, cb) {
    if (!cb && typeof opts == 'function') {
      cb = opts
      opts = 0
    }
    if (!opts) opts = {}

    fetchFeedQueue(cb, function(cbs) {
      // do we have a local cache?
      if (opts.refresh && ha.feed.getLength()) {
        ha.feed.splice(0, ha.feed.getLength()) // clear it out
      }

      // fetch feed stream
      // :TODO: start from where we currently are if there are already messages in the feed
      pull(
        toPull(client.api.createFeedStream()),
        pull.asyncMap(function(m, cb) {
          ha.fetchProfile(m.author, function(err, profile) {
            if (err) console.error('Error loading profile for message', err, m)
            else m.authorNickname = profile.nickname
            cb(null, m)
          })
        }),
        pull.drain(function (m) {
          m = createMessage(m)
          if (messageIsCached(m)) return // :TODO: remove this once we only pull new messages
          if (m) ha.feed.unshift(m)
        }, function() { cbs(null, ha.feed()) })
      )
    })
  }

  // temporary helper to check if we already have the message in our feed cache
  function messageIsCached(a) {
    if (!a) return false
    for (var i=0; i < ha.feed.getLength(); i++) {
      var b = ha.feed.get(i)
      if (util.toHexString(a.signature) == util.toHexString(b.signature)) {
        return true
      }
    }
    return false
  }

  // loads the profile's feed (from the backend or cache)
  var fetchProfileFeedQueue = util.queue()
  ha.fetchProfileFeed = function(profid, cb) {
    var idStr = util.toHexString(profid)
    fetchProfileFeedQueue(idStr, cb, function(cbs) {
      ha.fetchProfile(profid, function(err, profile) {
        if (err) return cb(err)
        if (!profile) return cb()
        var done = multicb()

        // fetch feed if not empty :TODO: just see if there are any new
        if (!profile.feed.getLength()) { 
          pull(
            toPull(client.api.createHistoryStream(util.toBuffer(profid), 0)),
            pull.drain(function (m) {
              m.authorNickname = profile.nickname
              m = createMessage(m)
              if (m.type == 'init') profile.joinDate.set(util.prettydate(new Date(m.timestamp), true))
              if (m) profile.feed.push(m)
            }, done())
          )
        }

        // fetch isFollowing state
        if (ha.user.idStr() != idStr) {
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
  ha.fetchServers = function(cb) {
    fetchServersQueue(cb, function(cbs) {
      // fetch nodes
      client.api.getNodes(function(err, nodes) {
        if (err) return cbs(err)

        // clear if not empty
        if (ha.servers.getLength())
          ha.servers.splice(0, ha.servers.getLength())

        // add servers
        nodes.forEach(function(node) {
          ha.servers.push(createServer({ hostname: node[0], port: node[1] }))
        })
        cbs(null, ha.servers())
      })
    })
  }

  // posts to the feed
  ha.publishText = function(str, cb) {
    if (!str.trim()) return cb(new Error('Can not post an empty string to the feed'))
    client.api.text_post(str, cb)
  }

  // begins following a feed
  ha.addFeed = function(token, cb) {
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
      ha.fetchProfile(id, function(err, profile) {
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
  ha.removeFeed = function(id, cb) {
    var id = util.toBuffer(id)
    client.api.unfollow(util.toBuffer(id), function(err) {
      if (err) return cb(err)
      ha.fetchProfile(id, function(err, profile) {
        if (profile)
          profile.isFollowing.set(false)
        cb()
      })
    })
  }

  // adds a server to the network table
  ha.addServer = function(addr, cb) {
    if (typeof addr == 'string')
      addr = addr.split(':')
    if (!addr[0]) return cb(new Error('Invalid address'))
    addr[1] = +addr[1] || 80
    
    client.api.addNode(addr[0], addr[1], function(err) {
      if (err) return cb(err)
      ha.servers.push(createServer({ hostname: addr[0], port: addr[1] }))
    })
  }

  // removes a server from the network table
  ha.removeServer = function(addr, cb) {
    if (typeof addr == 'string')
      addr = addr.split(':')
    if (!addr[0]) return cb(new Error('Invalid address'))
    addr[1] = +addr[1] || 80

    client.api.delNode(addr[0], addr[1], function(err) {
      if (err) return cb(err)

      // find and remove from the local cache
      for (var i=0; i < ha.servers.getLength(); i++) {
        var s = ha.servers.get(i)
        if (s.hostname == addr[0] && s.port == addr[1]) {
          ha.servers.splice(i, 1)
          break
        }
      }
      cb()
    })
  }



  return ha
}

function createMessage(initialState) {
  var state = extend(defaults.message, initialState)
  try {
    state.type = (new Buffer(state.type)).toString()
    state.authorStr = (new Buffer(state.author)).toString('hex')
    state.message = msgpack.decode(new Buffer(state.message))
  } catch(e) {
    if (state.type != 'init') { // :TODO: may need to remove in the future? not sure if the init message with go msgpack
      console.log('Bad message encoding', state)
      return null
    }
  }
  return mercury.struct(state)
}

function createProfile(initialState) {
  var state = extend(defaults.profile, initialState)
  state.feed = mercury.array(state.feed.map(createMessage))
  state.joinDate = mercury.value(state.joinDate)
  state.isFollowing = mercury.value(state.isFollowing)
  return mercury.struct(state)
}

function createServer(initialState) {
  var state = extend(defaults.server, initialState)
  state.url = 'http://' + state.hostname + ':' + state.port
  return mercury.struct(state)
}