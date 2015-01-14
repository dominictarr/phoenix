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

  app.setConnectionStatus = function (isConnected, message) {
    var connStatus = document.getElementById('conn-status')
    connStatus.innerHTML = ''
    if (!isConnected)
      connStatus.appendChild(h('.alert.alert-danger', message))
  }

  app.followPrompt = function(e) {
    e.preventDefault()

    var id = prompt('Enter the contact id or invite code')
    if (!id)
      return

    var parts = id.split(',')
    var isInvite = (parts.length === 3)
    if (isInvite) ssb.invite.addMe(id, next)
    else schemas.addFollow(ssb, id, next)
      
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
        app.refreshPage()
      }
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
