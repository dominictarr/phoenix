// var cuid = require('cuid')
var extend = require('xtend')
var mercury = require('mercury')
var pull = require('pull-stream')
var toPull = require('stream-to-pull-stream')
var msgpack = require('msgpack-js')
var multicb = require('multicb')

var backend = require('./lib/backend')
var util = require('../../../lib/util')

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
    route: '',
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
    lastSync: ''
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
    route:      mercury.value(state.route),
    feed:       mercury.array(state.feed.map(createMessage)),
    profiles:   mercury.array(state.profiles.map(createProfile)),
    profileMap: mercury.value(profileMap),
    servers:    mercury.array(state.servers.map(createServer)),
    user:       mercury.struct({
      id:        mercury.value(state.user.id),
      idStr:     mercury.value(state.user.idStr),
      pubkey:    mercury.value(state.user.pubkey),
      pubkeyStr: mercury.value(state.user.pubkeyStr)
    }),
    lastSync:   mercury.value(state.lastSync),
    events:     events
  })

  // load data from the backend
  var client = backend.connect()
  // session
  client.api.getKeys(function(err, keys) {
    if (err) throw err
    ha.user.id.set(util.toBuffer(keys.name))
    ha.user.idStr.set(util.toHexString(keys.name))
    ha.user.pubkey.set(util.toBuffer(keys.public))
    ha.user.pubkeyStr.set(util.toHexString(keys.public))
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
    if (profile) return console.log('using cache', idStr), cb(null, profile)
    console.log('actually fetching', idStr)

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
  ha.fetchFeed = function(cb) {
    fetchFeedQueue(cb, function(cbs) {
      // stop if not empty :TODO: see if there are any new
      if (ha.feed.getLength())
        return cbs(null, ha.feed())

      // fetch feed stream
      pull(
        toPull(client.api.createFeedStream({reverse: true})),
        pull.asyncMap(function(m, cb) {
          ha.fetchProfile(m.author, function(err, profile) {
            if (err) console.error('Error loading profile for message', err, m)
            else m.authorNickname = profile.nickname
            cb(null, m)
          })
        }),
        pull.drain(function (m) {
          m = createMessage(m)
          if (m) ha.feed.push(m)
        }, function() { cbs(null, ha.feed()) })
      )
    })
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
              if (m) profile.feed.push(m)
            }, done())
          )
        }

        // fetch isFollowing state
        if (ha.user.idStr() != idStr) {
          var cb2 = done()
          client.api.isFollowing(idStr, function(err) {
            profile.isFollowing(!err)
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

  return ha
}

function createMessage(initialState) {
  var state = extend(defaults.message, initialState)
  try {
    state.type = (new Buffer(state.type)).toString()
    state.authorStr = (new Buffer(state.author)).toString('hex')
    state.message = msgpack.decode(new Buffer(state.message))
  } catch(e) {
    console.log('Bad message encoding', state)
    return null
  }
  return mercury.struct(state)
}

function createProfile(initialState) {
  var state = extend(defaults.profile, initialState)
  state.feed = mercury.array(state.feed.map(createMessage))
  state.isFollowing = mercury.value(state.isFollowing)
  return mercury.struct(state)
}

function createServer(initialState) {
  var state = extend(defaults.server, initialState)
  state.url = 'http://' + state.hostname + ':' + state.port
  return mercury.struct(state)
}