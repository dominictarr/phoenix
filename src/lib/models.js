// var cuid = require('cuid')
var extend = require('xtend')
var mercury = require('mercury')

module.exports = {
  homeApp: createHomeApp,
  message: createMessage,
  profile: createProfile,
  localPeer: createLocalPeer,
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

    bubble: {
      show: false,
      msg: '',
      type: ''
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
    servers: [],
    user: {
      id: null,
      pubkey: null,
      nickname: '',
      followedUsers: [],
      followerUsers: []
    },

    localPeers: [],
    useLocalNetwork: false,

    userPages: [],

    lastSync: '',
    syncMsgsWaiting: 0,
    isSyncing: false
  },

  message: {
    id: null,
    type: null,
    author: null,
    content: null,
    previous: null,
    sequence: 0,
    signature: null,
    timestamp: 0,
    authorNickname: '',
    isRunning: false,
    isViewRaw: false,
    hidden: false,
    rebroadcastsLink: null,
    repliesToLink: null
  },

  profile: {
    id: null,
    feed: [],
    nickname: '',
    joinDate: '',
    statuses: [],
    isFollowing: false
  },

  localPeer: {
    id: '',
    host: '',
    port: null,
    nickname: ''
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
    authorNickname: '',
    msgText: ''
  }
}

// Constructors
// ============

function createHomeApp(events, initialState) {
  var state = extend(defaults.homeApp, initialState)
  // create object
  return window.STATE = mercury.struct({
    route:            mercury.value(state.route),
    events:           events,

    conn:             mercury.struct({
      hasError:         mercury.value(state.conn.hasError),
      explanation:      mercury.value(state.conn.explanation)
    }),

    bubble:           mercury.struct({
      show:             mercury.value(state.bubble.show),
      type:             mercury.value(state.bubble.type),
      msg:              mercury.value(state.bubble.msg)
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

    accessTime:         mercury.value(+(localStorage.accessTime || 0)),
    unreadMessages:     mercury.value(0),
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
    servers:          mercury.array(state.servers),
    user:             mercury.struct({
      id:               mercury.value(state.user.id),
      pubkey:           mercury.value(state.user.pubkey),
      nickname:         mercury.value(state.user.nickname),
      followedUsers:    mercury.array(state.user.followedUsers),
      followerUsers:    mercury.array(state.user.followerUsers)
    }),

    localPeers:       mercury.array(state.localPeers.map(createLocalPeer)),
    useLocalNetwork:  mercury.value(state.useLocalNetwork),

    userPages:        mercury.value(state.userPages),

    lastSync:         mercury.value(state.lastSync),
    syncMsgsWaiting:  mercury.value(state.syncMsgsWaiting),
    isSyncing:        mercury.value(state.isSyncing)
  })
}

function createMessage(initialState) {
  var state = extend(defaults.message, initialState)
  state.isRunning        = mercury.value(state.isRunning)
  state.isViewRaw        = mercury.value(state.isViewRaw)
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
  state.statuses = mercury.array(state.statuses)
  state.isFollowing = mercury.value(state.isFollowing)
  return mercury.struct(state)
}

function createLocalPeer(initialState) {
  var state = extend(defaults.localPeer, initialState)
  state.nickname = mercury.value(state.nickname)
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
