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
    page: {
      id: 'feed',
      param: null
    },
    pendingMessages: 0,
    unreadMessages: 0,
    suggestOptions: require('./lib/suggest-options'),
  }

  // page behaviors

  window.addEventListener('hashchange', function() { refreshPage() })
  document.body.addEventListener('click', function (e) {
    // look for link clicks which should trigger same-page refreshes
    var el = e.target
    while (el) {
      if (el.tagName == "A" && el.origin == window.location.origin && el.hash && el.hash == window.location.hash)
        return e.preventDefault(), e.stopPropagation(), app.refreshPage()
      el = el.parentNode
    }
  })

  // periodically poll and rerender the current connections
  setInterval(function () {
    ssb.gossip.peers(function (err, peers) {
      if (err)
        return
      Array.prototype.forEach.call(document.querySelectorAll('table.peers tbody'), function (tb) {
        tb.innerHTML = ''
        com.peers(app, peers).forEach(function (row) {
          tb.appendChild(row)
        })
      })
    })
  }, 5000)

  // toplevel & common methods

  // should be called each time the rpc connection is (re)established
  app.setupRpcConnection = function () {
    pull(ssb.phoenix.events(), pull.drain(function (event) {
      if (event.type == 'post')
        app.setPendingMessages(app.pendingMessages + 1)
    }))
  }

  var refreshPage =
  app.refreshPage = function () {
    // clear pending messages
    app.setPendingMessages(0)

    // run the router
    var route = router(window.location.hash, 'posts')
    app.page.id = route[0]
    app.page.param = route[1]

    // refresh suggest options for usernames
    var profiles = 
    app.suggestOptions['@'] = []
    ssb.phoenix.getNamesById(function (err, names) {
      for (var k in names) {
        var name = names[k] || k
        app.suggestOptions['@'].push({ title: name, subtitle: util.shortString(k), value: name })
      }
    })

    // collect common data
    var done = multicb({ pluck: 1 })
    ssb.whoami(done())
    ssb.phoenix.getNamesById(done())
    ssb.phoenix.getInboxCount(done())
    done(function (err, data) {
      if (err) throw err.message
      app.myid = data[0].id
      app.names = data[1]
      app.unreadMessages = data[2] - (+localStorage.readMessages || 0)
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
        console.log('nope')
        window.location.hash = '#/'
        return
      }

      // render the page
      var page = pages[app.page.id]
      if (!page)
        page = pages.notfound
      page(app)
    })
  }

  app.showUserId = function () { 
    ssb.whoami(function (err, user) {
      swal('Here is your contact id', user.id)
    })
  }

  app.setPendingMessages = function (n) {
    app.pendingMessages = n
    if (n) document.title = '('+n+') secure scuttlebutt'
    else document.title = 'secure scuttlebutt'
  }

  app.setStatus = function (type, message) {
    var status = document.getElementById('app-status')
    status.innerHTML = ''
    if (type)
      status.appendChild(h('.alert.alert-'+type, message))
  }

  app.followPrompt = function(e) {
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
      ssb.invite.addMe(id, next)
    }
    else schemas.addFollow(ssb, id, next)
      
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

  app.setNamePrompt = function (userId) {
    ssb.whoami(function (err, user) {
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
        schemas.addOwnName(ssb, name, done)
      else
        schemas.addOtherName(ssb, userId, name, done)

      function done(err) {
        if (err) swal('Error While Publishing', err.message, 'error')
        else app.refreshPage()
      }
    })
  }

  app.setPage = function(name, page, opts) {
    var el = document.getElementById('page-container')
    el.innerHTML = ''
    if (!opts || !opts.noHeader)
      el.appendChild(com.page(app, name, page))
    else
      el.appendChild(h('#page.container-fluid.'+name+'-page', page))
  }

  return app
}
