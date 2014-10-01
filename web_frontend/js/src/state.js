// var cuid = require('cuid')
var extend = require('xtend')
var mercury = require('mercury')

module.exports = {
  homeApp: homeApp,
  message: message,
  profile: profile
}

// Models
// ======
var HomeApp = {
  route: '',
  feed: [],
  profiles: [],
  currentUserId: ''
}

var Message = {
  type: '',
  plain: '',
  authorNickame: ''
}

var Profile = {
  id: null,
  nickame: ''
}

// Constructors
// ============

function homeApp(events, initialState) {
  var state = extend(HomeApp, initialState)

  return mercury.struct({
    route: mercury.value(state.route),
    feed: mercury.array(state.feed.map(message)),
    profiles: mercury.array(state.profiles.map(profile)),
    currentUserId: mercury.value(state.currentUserId),
    events: events
  })
}

function message(initialState) {
  var state = extend(Message, initialState)

  return mercury.struct({
    type: state.type,
    plain: state.plain,
    authorNickname: state.authorNickname
  })
}

function profile(initialState) {
  var state = extend(Profile, initialState)

  return mercury.struct({
    id: state.id,
    nickame: state.nickame
  })
}
