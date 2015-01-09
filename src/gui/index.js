var h = require('hyperscript')
var pull = require('pull-stream')
var multicb = require('multicb')
var emojiNamedCharacters = require('emoji-named-characters')
var router = require('phoenix-router')
var com = require('./com')
var pages = require('./pages')
var util = require('../lib/util')

// gui master state object
var state = {
  apis: {},
  
  // computed state
  msgs: [],
  msgsById: {},
  inbox: [],
  adverts: [],
  profiles: {},
  names: {},
  peers: [],
  edges: {},

  // ui state
  user: {
    id: null
  },
  page: {
    id: 'feed',
    param: null
  },
  pendingMessages: 0,
  unreadMessages: 0,
  suggestOptions: {}
}

// setup emoji options for the suggest box
state.suggestOptions[':'] = []
for (var emoji in emojiNamedCharacters) {
  state.suggestOptions[':'].push({
    image: '/img/emoji/' + emoji + '.png',
    title: emoji,
    subtitle: emoji,
    value: emoji + ':'
  })
}

// init func
module.exports = function(ssb, feed, profiles, friends) {
  // connect the state object to the apis
  state.apis.ssb = ssb
  state.apis.feed = feed
  state.apis.profiles = profiles
  state.apis.friends = friends

  // wire up toplevel event handlers
  document.body.addEventListener('click', navClickHandler)
  window.addEventListener('hashchange', function() { state.sync() })
  return state
}


var lastSync
state.sync = function(cb) {
  var ssb = this.apis.ssb
  var feed = this.apis.feed
  var profiles = this.apis.profiles
  var friends = this.apis.friends

  // clear pending messages
  this.setPendingMessages(0)

  // run the router
  var route = router(window.location.hash, 'posts')
  state.page.id = route[0]
  state.page.param = route[1]

  // sync the apis with ssb
  // :TODO: only one log feed
  var ts = Date.now()
  var done = multicb()
  pull(ssb.createLogStream({ gt: lastSync }), feed.in(done()))
  pull(ssb.createLogStream({ gt: lastSync }), profiles.in(done()))
  done(function(err) {
    if (err)
      console.error(err)
    lastSync = ts
      
    // pull data from the apis
    var done = multicb()
    pull(feed.all(), pull.collect(done()))
    pull(feed.inbox(state.user.id), pull.collect(done()))
    pull(feed.adverts(), pull.collect(done()))
    profiles.getAll(done())
    friends.all('follow', done())
    friends.all('trust', done())
    friends.all('flag', done())
    done(function(err, r) {
      if (err)
        console.error(err)
      else {
        // pull state
        state.msgs = r[0][1]
        state.inbox = r[1][1]
        state.adverts = r[2][1]
        state.profiles = r[3][1]
        state.edges.follow = r[4][1]
        state.edges.trust = r[5][1]
        state.edges.flag = r[6][1]

        // compute additional structures
        state.msgs.forEach(function(msg) {
          state.msgsById[msg.key] = msg
        })
        state.suggestOptions['@'] = []
        for (var k in state.profiles) {
          var profile = state.profiles[k]
          state.names[k] = getName(profile)
          state.suggestOptions['@'].push({ title: state.names[profile.id], subtitle: util.shortString(profile.id), value: state.names[profile.id] })
        }
        var readMessages = []
        try { readMessages = JSON.parse(localStorage.readMessages) } catch(e) {}
        state.unreadMessages = state.inbox.reduce(function(acc, mid) {
          return (readMessages.indexOf(mid) === -1) ? (acc + 1) : acc
        }, 0)
      }
      
      // setup page reroute
      if (!state.profiles[state.user.id].self.name)
        window.location.hash = '#/setup'
      else if (window.location.hash == '#/setup')
        window.location.hash = '#/'

      // re-render the page
      var page = pages[state.page.id]
      if (!page)
        page = pages.notfound
      page(state)
    })
  })
}

state.setUserId = function(id) { state.user.id = id }
state.showUserId = function() { swal('Here is your contact id', state.user.id) }

state.hasEdge = function (type, a, b) { return state.edges[type] && state.edges[type][a] && state.edges[type][a][b] }
state.addEdge = function (type, target, cb) {
  // TODO should this be in the state object? seems like interpretation layer
  if (!target || typeof target != 'string') return cb(new Error('`target` string is required'))
  state.apis.ssb.add({ type: type, rel: type+'s', feed: target }, cb)
}
state.delEdge = function (type, target, cb) {
  // TODO should this be in the state object? seems like interpretation layer
  if (!target || typeof target != 'string') return cb(new Error('`target` string is required'))
  state.apis.ssb.add({ type: type, rel: 'un'+type+'s', feed: target }, cb)
}

state.setConnectionStatus = function (isConnected, message) {
  var connStatus = document.getElementById('conn-status')
  connStatus.innerHTML = ''
  if (!isConnected)
    connStatus.appendChild(h('.alert.alert-danger', message))
}

state.setPendingMessages = function(n) {
  this.pendingMessages = n
  var syncbtn = document.querySelector('.sync-btn')
  if (n) {
    document.title = '('+n+') secure scuttlebutt'
    if (syncbtn) syncbtn.textContent = 'Sync ('+n+')'
  } else {
    document.title = 'secure scuttlebutt'
    if (syncbtn) syncbtn.textContent = 'Sync'
  }
}

state.followPrompt = function(e) {
  e.preventDefault()

  var id = prompt('Enter the contact id or invite code')
  if (!id)
    return

  var parts = id.split(',')
  var isInvite = (parts.length === 3)
  if (isInvite) state.apis.ssb.invite.addMe(id, next)
  else state.addEdge('follow', id, next)
    
  function next (err) {
    if (err) {
      console.error(err)
      swal('Error While Connecting', err.message, 'error')
    }
    else {
      if (isInvite)
        swal('Invite Code Accepted', 'You are now hosted by '+parts[0], 'success')
      else
        swal('Contact Added', 'You will now follow the messages published by your new contact.', 'success')
      state.sync()
    }
  }
}

state.setNamePrompt = function (userId) {
  userId = userId || state.user.id
  var isSelf = state.user.id == userId
  
  var name = (isSelf) ?
    prompt('What would you like your nickname to be?') :
    prompt('What would you like their nickname to be?')
  if (!name)
    return

  if (!confirm('Set nickname to '+name+'?'))
    return

  if (isSelf)
    state.apis.profiles.nameSelf(name, done)
  else
    state.apis.profiles.nameOther(userId, name, done)

  function done(err) {
    if (err) swal('Error While Publishing', err.message, 'error')
    else state.sync()
  }
}

state.setPage = function(page) {
  var el = document.getElementById('page-container')
  el.innerHTML = ''
  el.appendChild(page)
}

var spacesRgx = /\s/g
function noSpaces(str) {
  return str.replace(spacesRgx, '_')
}

function getName(profile) {
  if (profile.id == state.user.id)
    return noSpaces(profile.self.name) || util.shortString(profile.id)
  for (var id in profile.given) {
    if (id == state.user.id && profile.given[id].name)
      return noSpaces(profile.given[id].name)
  }
  return (profile.self.name) ? '"'+noSpaces(profile.self.name)+'"' : 'anon'//util.shortString(profile.id)
}

// looks for link clicks which should trigger page refreshes
// (normally this is handled by onhashchange, but we need to watch for "on same page" clicks)
function navClickHandler(e) {
  var el = e.target
  while (el) {
    // check if this is a page navigation
    if (el.tagName == "A" && el.origin == window.location.origin && el.hash && el.hash == window.location.hash)
      return e.preventDefault(), e.stopPropagation(), state.sync()

    // bubble up and keep looking
    el = el.parentNode
  }
}
