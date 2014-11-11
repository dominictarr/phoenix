// var cuid = require('cuid')
var extend = require('xtend')
var mercury = require('mercury')
var msgpack = require('msgpack-js')

module.exports = {
  homeApp: createHomeApp,
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
    route: '',

    conn: {
      hasError: false,
      explanation: ''
    },

    feedView: {
      messages: [],
      messageMap: {},
      publishFormMap: { feed: 0 },
      publishForms: [{
        id: 'feed',
        type: 'text',
        textPlaceholder: 'Publish...',
        permanent: true,
        error: false
      }],
      pagination: {
        start: 0,
        end: 0
      },
      filters: {
        shares: true,
        textPosts: true,
        actionPosts: true,
        guiPosts: true,
        follows: true
      },
      replies: {},
      rebroadcasts: {}
    },

    notifications: [],
    suggestBox: {
      active: false,
      positionX: 0,
      positionY: 0,
      selection: 0,
      textValue: '',
      options: [],
      filtered: []
    },

    profiles: [],
    profileMap: {},
    nicknameMap: {},
    followedUsers: [],
    followerUsers: [],
    servers: [],
    user: {
      id: null,
      idStr: '',
      pubkey: null,
      pubkeyStr: '',
      nickname: ''
    },

    userPages: [],

    lastSync: '',
    isSyncing: false
  },

  message: {
    id: null,
    type: null,
    author: null,
    authorStr: '',
    content: null,
    previous: null,
    sequence: 0,
    signature: null,
    timestamp: 0,
    authorNickname: '',
    isRunning: false,
    hidden: false,
    rebroadcastsLink: null,
    repliesToLink: null
  },

  profile: {
    id: null,
    idStr: '',
    feed: [],
    nickname: '',
    joinDate: '',
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
    textValue: '',
    permanent: false,
    isRunning: false,
    error: false
  },

  notification: {
    type: '',
    msgIdStr: '',
    authorNickname: '',
    msgText: ''
  }
}

// Constructors
// ============

function createHomeApp(events, initialState) {
  var state = extend(defaults.homeApp, initialState)

  // create object
  return mercury.struct({
    route:            mercury.value(state.route),
    events:           events,

    conn:             mercury.struct({
      hasError:         mercury.value(state.conn.hasError),
      explanation:      mercury.value(state.conn.explanation)
    }),

    feedView:         mercury.struct({
      messages:         mercury.array(state.feedView.messages.map(createMessage)),
      messageMap:       mercury.value(state.feedView.messageMap),
      publishForms:     mercury.array(state.feedView.publishForms.map(createPublishForm)),
      publishFormMap:   mercury.value(state.feedView.publishFormMap),
      pagination:       mercury.struct({
        start:            mercury.value(state.feedView.pagination.start),
        end:              mercury.value(state.feedView.pagination.end)
      }),
      filters:          mercury.struct({
        shares:           mercury.value(state.feedView.filters.shares),
        textPosts:        mercury.value(state.feedView.filters.textPosts),
        actionPosts:      mercury.value(state.feedView.filters.actionPosts),
        guiPosts:         mercury.value(state.feedView.filters.guiPosts),
        follows:          mercury.value(state.feedView.filters.follows)
      }),
      replies:          mercury.value(state.feedView.replies),
      rebroadcasts:     mercury.value(state.feedView.rebroadcasts),
    }),

    notifications:    mercury.array(state.notifications.map(createNotification)),
    suggestBox:       mercury.struct({
      active:           mercury.value(state.suggestBox.active),
      positionX:        mercury.value(state.suggestBox.positionX),
      positionY:        mercury.value(state.suggestBox.positionY),
      selection:        mercury.value(state.suggestBox.selection),
      textValue:        mercury.value(state.suggestBox.textValue),
      options:          mercury.array(state.suggestBox.options),
      filtered:         mercury.array(state.suggestBox.filtered)
    }),

    profiles:         mercury.array(state.profiles.map(createProfile)),
    profileMap:       mercury.value(state.profileMap),
    nicknameMap:      mercury.value(state.nicknameMap),
    followedUsers:    mercury.array(state.followedUsers),
    followerUsers:    mercury.array(state.followerUsers),
    servers:          mercury.array(state.servers.map(createServer)),
    user:             mercury.struct({
      id:               mercury.value(state.user.id),
      idStr:            mercury.value(state.user.idStr),
      pubkey:           mercury.value(state.user.pubkey),
      pubkeyStr:        mercury.value(state.user.pubkeyStr),
      nickname:         mercury.value(state.user.nickname)
    }), 

    userPages:        mercury.value(state.userPages),

    lastSync:         mercury.value(state.lastSync),
    isSyncing:        mercury.value(state.isSyncing)
  })
}

function createMessage(initialState) {
  var state = extend(defaults.message, initialState)
  state.authorStr        = state.author.toString('hex')
  state.isRunning        = mercury.value(state.isRunning)
  state.hidden           = mercury.value(state.hidden)
  state.rebroadcastsLink = mercury.value(state.rebroadcastsLink)
  state.repliesToLink    = mercury.value(state.repliesToLink)
  return mercury.struct(state)
}

function createProfile(initialState) {
  var state = extend(defaults.profile, initialState)
  state.feed = mercury.array(state.feed.map(createMessage))
  state.nickname = mercury.value(state.nickname)
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
  state.type      = mercury.value(state.type)
  state.textValue = mercury.value(state.textValue)
  state.isRunning = mercury.value(state.isRunning)
  state.error     = mercury.value(state.error)
  return mercury.struct(state)
}

function createNotification(initialState) {
  var state = extend(defaults.notification, initialState)
  return mercury.struct(state)
}