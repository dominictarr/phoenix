var h = require('hyperscript')
var pull = require('pull-stream')
var multicb = require('multicb')
var emojiNamedCharacters = require('emoji-named-characters')
var router = require('phoenix-router')
var com = require('./com')
var pages = require('./pages')
var handlers = require('./handlers')
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

  // ui state
  user: {
    id: null,
    following: [],
    followers: []
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
module.exports = function(ssb, feed, profiles, network) {
  // connect the state object to the apis
  state.apis.ssb = ssb
  state.apis.feed = feed
  state.apis.profiles = profiles
  state.apis.network = network

  // wire up toplevel event handlers
  document.body.addEventListener('click', runHandler('click'))
  document.body.addEventListener('submit', runHandler('submit'))
  window.addEventListener('hashchange', function() { state.sync() })
  return state
}


var lastSync
state.sync = function(cb) {
  var ssb = this.apis.ssb
  var feed = this.apis.feed
  var profiles = this.apis.profiles
  var network = this.apis.network

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
  pull(ssb.createLogStream({ gt: lastSync }), network.in(done()))
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
    pull(network.pubPeers(), pull.collect(done()))
    pull(network.following(state.user.id), pull.collect(done()))
    pull(network.followers(state.user.id), pull.collect(done()))
    done(function(err, r) {
      if (err)
        console.error(err)
      else {
        // pull state
        state.msgs = r[0][1]
        state.inbox = r[1][1]
        state.adverts = r[2][1]
        state.profiles = r[3][1]
        state.peers = r[4][1]
        state.user.following = r[5][1]
        state.user.followers = r[6][1]

        // compute additional structures
        state.msgs.forEach(function(msg) {
          state.msgsById[msg.key] = msg
        })
        state.suggestOptions['@'] = []
        for (var k in state.profiles) {
          var profile = state.profiles[k]
          state.names[k] = getName(profile)
          state.suggestOptions['@'].push({ title: state.names[profile.id], subtitle: util.shortString(profile.id), value: profile.id })
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
  else state.apis.network.follow(id, next)
    
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

state.setPage = function(page) {
  var el = document.getElementById('page-container')
  el.innerHTML = ''
  el.appendChild(page)
}

function getName(profile) {
  if (profile.id == state.user.id)
    return profile.self.name || util.shortString(profile.id)
  for (var id in profile.given) {
    if (id == state.user.id && profile.given[id].name)
      return profile.given[id].name
  }
  return (profile.self.name) ? '"'+profile.self.name+'"' : 'anon'//util.shortString(profile.id)
}

// - we map $HANDLER to events emitted by els with class of 'ev-$HANDLER'
function runHandler(eventType) {
  return function(e) {
    // close any dropdowns
    if (eventType == 'click') {
      Array.prototype.forEach.call(document.querySelectorAll('.dropdown'), function(el) {
        el.classList.remove('open')
      })
    }

    var el = e.target
    while (el) {
      // check if this is a page navigation
      // (normally this is handled by onhashchange, but we need to watch for "on same page" clicks)
      if (eventType == 'click' && el.tagName == "A" && el.origin == window.location.origin && el.hash && el.hash == window.location.hash)
        return e.preventDefault(), e.stopPropagation(), state.sync()
      // try handlers
      for (var k in handlers) {
        if (k.indexOf(eventType) === -1) continue // filter by evt type
        if (el.classList && el.classList.contains(k)) {
          e.preventDefault()
          e.stopPropagation()
          return handlers[k](state, el, e)
        }
      }
      // bubble up and keep looking
      el = el.parentNode
    }
  }
}
