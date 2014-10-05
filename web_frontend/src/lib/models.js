// var cuid = require('cuid')
var extend = require('xtend')
var mercury = require('mercury')
var msgpack = require('msgpack-js')

module.exports = {
  homeApp: createHomeApp,
  pubApp: createPubApp,
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
    conn: {
      hasError: false,
      explanation: ''
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

  pubApp: {
    // gui state
    route: '',
    conn: {
      hasError: false,
      explanation: ''
    },

    // app data
    profiles: [],
    profileMap: {}
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
  return mercury.struct({
    route:       mercury.value(state.route),
    publishForm: mercury.struct({
      textFieldValue: mercury.value(state.publishForm.textFieldValue),
      textFieldRows:  mercury.value(state.publishForm.textFieldRows),
      preview:        mercury.value(state.preview)
    }),
    conn:        mercury.struct({
      hasError:       mercury.value(state.conn.hasError),
      explanation:    mercury.value(state.conn.explanation)
    }),
    events:      events,

    feed:        mercury.array(state.feed.map(createMessage)),
    profiles:    mercury.array(state.profiles.map(createProfile)),
    profileMap:  mercury.value(profileMap),
    servers:     mercury.array(state.servers.map(createServer)),
    user:        mercury.struct({
      id:             mercury.value(state.user.id),
      idStr:          mercury.value(state.user.idStr),
      pubkey:         mercury.value(state.user.pubkey),
      pubkeyStr:      mercury.value(state.user.pubkeyStr)
    }),
    lastSync:   mercury.value(state.lastSync),
    isSyncing:  mercury.value(state.isSyncing)
  })
}

function createPubApp(events, initialState) {
  var state = extend(defaults.pubApp, initialState)

  // create a map of profile ids to their indexes
  var profileMap = {}
  state.profiles.forEach(function(prof, i) {
    profileMap[prof.id.toString('hex')] = i
  })

  // create object
  return mercury.struct({
    route:       mercury.value(state.route),
    conn:        mercury.struct({
      hasError:       mercury.value(state.conn.hasError),
      explanation:    mercury.value(state.conn.explanation)
    }),
    events:      events,

    profiles:    mercury.array(state.profiles.map(createProfile)),
    profileMap:  mercury.value(profileMap),
  })
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