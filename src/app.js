'use strict'
var h          = require('hyperscript')
var multicb    = require('multicb')
var router     = require('phoenix-router')
var pull       = require('pull-stream')
var schemas    = require('ssb-msg-schemas')
var com        = require('./com')
var pages      = require('./pages')
var util       = require('./lib/util')

module.exports = function (ssb) {

  // master state object

  var app = {
    ssb: ssb,
    myid: null,
    names: null,
    nameTrustRanks: null,
    page: {
      id: 'feed',
      param: null
    },
    pendingMessages: 0,
    unreadMessages: 0,
    suggestOptions: require('./lib/suggest-options'),
  }

  // page behaviors

  window.addEventListener('hashchange', function() { app.refreshPage() })
  document.body.addEventListener('click', onClick(app))

  // toplevel & common methods
  app.setupRpcConnection = setupRpcConnection.bind(app)
  app.refreshPage        = refreshPage.bind(app)
  app.showUserId         = showUserId.bind(app)
  app.setPendingMessages = setPendingMessages.bind(app)
  app.setStatus          = setStatus.bind(app)
  app.followPrompt       = followPrompt.bind(app)
  app.setNamePrompt      = setNamePrompt.bind(app)
  app.setPage            = setPage.bind(app)
  app.pollPeers          = pollPeers.bind(app)

  // periodically poll and rerender the current connections
  setInterval(app.pollPeers, 5000)

  return app
}

function onClick (app) {
  return function (e) {
    // look for link clicks which should trigger same-page refreshes
    var el = e.target
    while (el) {
      if (el.tagName == 'A' && el.origin == window.location.origin && el.hash && el.hash == window.location.hash)
        return e.preventDefault(), e.stopPropagation(), app.refreshPage()
      el = el.parentNode
    }
  }
}

function pollPeers () {
  var app = this
  var peersTables = Array.prototype.slice.call(document.querySelectorAll('table.peers tbody'))
  if (!peersTables.length)
    return // only update if peers are in the ui
  app.ssb.gossip.peers(function (err, peers) {
    if (err)
      return
    peersTables.forEach(function (tb) {  
      tb.innerHTML = ''
      com.peers(app, peers).forEach(function (row) {
        tb.appendChild(row)
      })
    })
  })
}

// should be called each time the rpc connection is (re)established
function setupRpcConnection () {
  var app = this
  pull(app.ssb.phoenix.events(), pull.drain(function (event) {
    if (event.type == 'post' || event.type == 'notification')
      app.setPendingMessages(app.pendingMessages + 1)
  }))
}

function refreshPage (e) {
  var app = this
  e && e.preventDefault()

  // clear pending messages
  app.setPendingMessages(0)

  // run the router
  var route = router(window.location.hash, 'posts')
  app.page.id    = route[0]
  app.page.param = route[1]
  app.page.qs    = route[2] || {}

  // refresh suggest options for usernames
  app.suggestOptions['@'] = []
  app.ssb.phoenix.getNamesById(function (err, names) {
    for (var k in names) {
      var name = names[k] || k
      app.suggestOptions['@'].push({ title: name, subtitle: util.shortString(k), value: name })
    }
  })

  // collect common data
  var done = multicb({ pluck: 1 })
  app.ssb.whoami(done())
  app.ssb.phoenix.getNamesById(done())
  app.ssb.phoenix.getNameTrustRanks(done())
  app.ssb.phoenix.getInboxCount(done())
  done(function (err, data) {
    if (err) throw err.message
    app.myid = data[0].id
    app.names = data[1]
    app.nameTrustRanks = data[2]
    app.unreadMessages = data[3] - (+localStorage.readMessages || 0)
    if (app.unreadMessages < 0) {
      // probably a new account on the machine, reset
      app.unreadMessages = 0
      localStorage.readMessages = 0
    }

    // re-route to setup if needed
    if (!app.names[app.myid]) {
      if (window.location.hash != '#/setup') {      
        window.location.hash = '#/setup'
        return
      }
    } else if (window.location.hash == '#/setup') {
      window.location.hash = '#/'
      return
    }

    // render the page
    h.cleanup()    
    var page = pages[app.page.id]
    if (!page)
      page = pages.notfound
    page(app)
  })
}

function showUserId () { 
  swal('Here is your contact id', this.myid)
}

function setPendingMessages (n) {
  this.pendingMessages = n
  try {
    if (n) {
      document.title = '('+n+') secure scuttlebutt'
      document.getElementById('get-latest').classList.remove('hidden')
      document.querySelector('#get-latest .btn').textContent = 'Get Latest ('+n+')'
    }
    else {
      document.title = 'secure scuttlebutt'
      document.getElementById('get-latest').classList.add('hidden')
      document.querySelector('#get-latest .btn').textContent = 'Get Latest'
    }
  } catch (e) {}
}

function setStatus (type, message) {
  var status = document.getElementById('app-status')
  status.innerHTML = ''
  if (type)
    status.appendChild(h('.alert.alert-'+type, message))
}

function followPrompt (e) {
  var app = this
  e.preventDefault()

  var id = prompt('Enter the contact id or invite code')
  if (!id)
    return

  // surrounded by quotes?
  // the scuttlebot cli ouputs invite codes with quotes, so this could happen
  if (id.charAt(0) == '"' && id.charAt(id.length - 1) == '"')
    id = id.slice(1, -1) // strip em

  var parts = id.split(',')
  var isInvite = (parts.length === 3)
  if (isInvite) {
    app.setStatus('info', 'Contacting server with invite code, this may take a few moments...')
    app.ssb.invite.addMe(id, next)
  }
  else schemas.addFollow(app.ssb, id, next)
    
  function next (err) {
    app.setStatus(false)
    if (err) {
      console.error(err)
      if (isInvite)
        swal('Invite Code Failed', userFriendlyInviteError(err.stack || err.message), 'error')
      else
        swal('Error While Publishing', err.message, 'error')
    }
    else {
      if (isInvite)
        swal('Invite Code Accepted', 'You are now hosted by '+parts[0], 'success')
      else
        swal('Contact Added', 'You will now follow the messages published by your new contact.', 'success')
      app.refreshPage()
    }
  }

  function userFriendlyInviteError(msg) {
    if (~msg.indexOf('incorrect or expired') || ~msg.indexOf('has expired'))
      return 'Invite code is incorrect or expired. Make sure you copy/pasted it correctly. If you did, ask the pub-server owner for a new code and try again.'
    if (~msg.indexOf('invalid') || ~msg.indexOf('feed to follow is missing') || ~msg.indexOf('may not be used to follow another key'))
      return 'Invite code is malformed. Make sure you copy/pasted it correctly. If you did, ask the pub-server owner for a new code and try again.'
    if (~msg.indexOf('pub server did not have correct public key'))
      return 'The pub server did not identify itself correctly for the invite code. Ask the pub-server owner for a new code and try again.'
    if (~msg.indexOf('unexpected end of parent stream'))
      return 'Failed to connect to the pub server. Check your connection, make sure the pub server is online, and try again.'
    if (~msg.indexOf('already following'))
      return 'You are already followed by this pub server.'
    return 'Sorry, an unexpected error occurred. Please try again.'
  }
}

function setNamePrompt (userId) {
  var app = this
  app.ssb.whoami(function (err, user) {
    userId = userId || user.id
    var isSelf = user.id === userId
    
    var name = (isSelf) ?
      prompt('What would you like your nickname to be?') :
      prompt('What would you like their nickname to be?')
    if (!name)
      return

    if (!confirm('Set nickname to '+name+'?'))
      return

    if (isSelf)
      schemas.addOwnName(app.ssb, name, done)
    else
      schemas.addOtherName(app.ssb, userId, name, done)

    function done(err) {
      if (err) swal('Error While Publishing', err.message, 'error')
      else app.refreshPage()
    }
  })
}

function setPage (name, page, opts) {
  var el = document.getElementById('page-container')
  el.innerHTML = ''
  if (!opts || !opts.noHeader)
    el.appendChild(com.page(this, name, page))
  else
    el.appendChild(h('#page.container-fluid.'+name+'-page', page))
}