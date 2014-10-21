// var cuid = require('cuid')
var extend = require('xtend')
var mercury = require('mercury')
var msgpack = require('msgpack-js')

module.exports = {
  homeApp: createHomeApp,
  pubApp: createPubApp,
  message: createMessage,
  profile: createProfile,
  server: createServer,
  publishForm: createPublishForm,
  notification: createNotification
}

// Models
// ======

var defaults = {
  homeApp: {
    // gui state
    route: '',
    publishForms: [],
    publishFormMap: {},
    suggestBox: {
      active: false,
      positionX: 0,
      positionY: 0,
      selection: 0,
      textValue: '',
      options: [],
      filtered: []
    },
    pagination: {
      start: 0,
      end: 0
    },
    conn: {
      hasError: false,
      explanation: ''
    },

    // app data
    feed: [],
    messageMap: {},
    feedReplies: {},
    feedRebroadcasts: {},
    notifications: [],
    profiles: [],
    profileMap: {},
    nicknameMap: {},
    servers: [],
    user: {
      id: null,
      idStr: '',
      pubkey: null,
      pubkeyStr: '',
      nickname: ''
    },
    lastSync: '',
    isSyncing: false
  },

  pubApp: {
    // gui state
    route: '',
    layout: [['side', 4], ['main', 8]],
    conn: {
      hasError: false,
      explanation: ''
    },

    // app data
    profiles: [],
    profileMap: {}
  },

  message: {
    id: null,
    type: null,
    author: null,
    authorStr: '',
    value: null,
    previous: null,
    sequence: 0,
    signature: null,
    timestamp: 0,
    authorNickname: '',
    isRunning: false,
    hidden: false
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
  },

  publishForm: {
    id: '',
    type: '',
    parent: undefined,
    textPlaceholder: '',
    textValue: '',
    textRows: 1,
    preview: '',
    permanent: false,
    isRunning: false,
    setValueTrigger: 1 // trigger counter - when changed, will force an overwrite of the form's input value
  },

  notification: {
    msgIdStr: '',
    authorNickname: '',
    msgText: '',
    read: false
  }
}

// Constructors
// ============

function createHomeApp(events, initialState) {
  var state = extend(defaults.homeApp, initialState)

  // create object
  return mercury.struct({
    route:            mercury.value(state.route),
    layout:           mercury.value(state.layout),
    publishForms:     mercury.array(state.publishForms.map(createPublishForm)),
    publishFormMap:   mercury.value(state.publishFormMap),
    suggestBox:       mercury.struct({
      active:           mercury.value(state.suggestBox.active),
      positionX:        mercury.value(state.suggestBox.positionX),
      positionY:        mercury.value(state.suggestBox.positionY),
      selection:        mercury.value(state.suggestBox.selection),
      textValue:        mercury.value(state.suggestBox.textValue),
      options:          mercury.array(state.suggestBox.options),
      filtered:         mercury.array(state.suggestBox.filtered)
    }),
    pagination:       mercury.struct({
      start:            mercury.value(state.pagination.start),
      end:              mercury.value(state.pagination.end)
    }),
    conn:             mercury.struct({
      hasError:         mercury.value(state.conn.hasError),
      explanation:      mercury.value(state.conn.explanation)
    }),
    events:           events,

    feed:             mercury.array(state.feed.map(createMessage)),
    messageMap:       mercury.value(state.messageMap),
    feedReplies:      mercury.value(state.feedReplies),
    feedRebroadcasts: mercury.value(state.feedRebroadcasts),
    notifications:    mercury.array(state.notifications.map(createNotification)),
    profiles:         mercury.array(state.profiles.map(createProfile)),
    profileMap:       mercury.value(state.profileMap),
    nicknameMap:      mercury.value(state.nicknameMap),
    servers:          mercury.array(state.servers.map(createServer)),
    user:             mercury.struct({
      id:               mercury.value(state.user.id),
      idStr:            mercury.value(state.user.idStr),
      pubkey:           mercury.value(state.user.pubkey),
      pubkeyStr:        mercury.value(state.user.pubkeyStr),
      nickname:         mercury.value(state.user.nickname)
    }), 
    lastSync:         mercury.value(state.lastSync),
    isSyncing:        mercury.value(state.isSyncing)
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
    layout:      mercury.value(state.layout),
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
  state.authorStr = state.author.toString('hex')
  state.isRunning = mercury.value(state.isRunning)
  state.hidden    = mercury.value(state.hidden)
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
  var hostname = state.hostname.indexOf(':') != -1 ?
    '[' + state.hostname + ']' : state.hostname
  state.url = 'http://' + hostname + ':' + state.port
  return mercury.struct(state)
}

function createPublishForm(initialState) {
  var state = extend(defaults.replyForm, initialState)
  state.type            = mercury.value(state.type)
  state.textPlaceholder = mercury.value(state.textPlaceholder)
  state.preview         = mercury.value(state.preview)
  state.textValue       = mercury.value(state.textValue)
  state.textRows        = mercury.value(state.textRows)
  state.isRunning       = mercury.value(state.isRunning)
  state.setValueTrigger = mercury.value(state.setValueTrigger)
  return mercury.struct(state)
}

function createNotification(initialState) {
  var state = extend(defaults.notification, initialState)
  state.read = mercury.value(state.read)
  return mercury.struct(state)
}