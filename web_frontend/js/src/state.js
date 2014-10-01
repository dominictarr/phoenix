// var cuid = require('cuid')
var extend = require('xtend')
var mercury = require('mercury')

module.exports = {
  homeApp: homeApp,
  message: message,
  profile: profile,
  server: server
}

// Models
// ======
var HomeApp = {
  route: '',
  feed: [],
  profiles: [],
  profileMap: {},
  servers: [],
  currentUserId: '',
  lastSync: ''
}

var Message = {
  type: '',
  timestamp: 0,
  author: null,
  authorNickame: '',
  message: null
}

var Profile = {
  id: null,
  nickname: '',
  joinDate: '',
  feed: []
}

var Server = {
  hostname: '',
  port: '',
  url: ''
}

// Constructors
// ============

function homeApp(events, initialState) {
  var state = extend(HomeApp, initialState)

  var profileMap = {}
  state.profiles.forEach(function(prof, i) {
    profileMap[prof.id.toString('hex')] = i
  })

  return mercury.struct({
    route: mercury.value(state.route),
    feed: mercury.array(state.feed.map(message)),
    profiles: mercury.array(state.profiles.map(profile)),
    profileMap: mercury.value(profileMap),
    servers: mercury.array(state.servers.map(server)),
    currentUserId: mercury.value(state.currentUserId),
    lastSync: mercury.value(state.lastSync),
    events: events
  })
}

function message(initialState) {
  var state = extend(Message, initialState)

  return mercury.struct({
    type: state.type,
    timestamp: state.timestamp,
    author: state.author,
    authorNickname: state.authorNickname,
    message: state.message
  })
}

function profile(initialState) {
  var state = extend(Profile, initialState)

  return mercury.struct({
    id: state.id,
    nickname: state.nickname,
    joinDate: state.joinDate,
    feed: mercury.array(state.feed.map(message))
  })
}

function server(initialState) {
  var state = extend(Server, initialState)

  return mercury.struct({
    hostname: state.hostname,
    port: state.port,
    url: 'http://' + state.hostname + ':' + state.port
  })
}