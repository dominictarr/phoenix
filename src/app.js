var h          = require('hyperscript')
var router     = require('phoenix-router')
var com        = require('./com')
var pages      = require('./pages')
var util       = require('./lib/util')

module.exports = function (api) {

  // master state object

  var app = {
    api: api,
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

  api.on('post', function (msg) {
    app.setPendingMessages(app.pendingMessages + 1)
  })

  // toplevel & common methods

  var refreshPage =
  app.refreshPage = function () {
    // clear pending messages
    app.setPendingMessages(0)

    // re-route to setup if needed
    if (!api.getMyProfile().self.name)
      window.location.hash = '#/setup'
    else if (window.location.hash == '#/setup')
      window.location.hash = '#/'

    // run the router
    var route = router(window.location.hash, 'posts')
    app.page.id = route[0]
    app.page.param = route[1]

    // setup suggest options for usernames
    var profiles = 
    app.suggestOptions['@'] = []
    for (var k in api.getAllProfiles()) {
      var name = api.getNameById(k) || k
      app.suggestOptions['@'].push({ title: name, subtitle: util.shortString(k), value: name })
    }

    // count unread messages
    app.unreadMessages = api.getInboxCount() - (+localStorage.readMessages || 0)

    // render the page
    var page = pages[app.page.id]
    if (!page)
      page = pages.notfound
    page(app)
  }

  app.showUserId = function () { 
    swal('Here is your contact id', api.getMyId())
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
    if (isInvite) api.useInvite(id, next)
    else api.addEdge('follow', id, next)
      
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
    userId = userId || api.getMyId()
    var isSelf = api.getMyId() === userId
    
    var name = (isSelf) ?
      prompt('What would you like your nickname to be?') :
      prompt('What would you like their nickname to be?')
    if (!name)
      return

    if (!confirm('Set nickname to '+name+'?'))
      return

    if (isSelf)
      api.nameSelf(name, done)
    else
      api.nameOther(userId, name, done)

    function done(err) {
      if (err) swal('Error While Publishing', err.message, 'error')
      else app.refreshPage()
    }
  }

  app.setPage = function(name, page) {
    var el = document.getElementById('page-container')
    el.innerHTML = ''
    el.appendChild(com.page(app, name, page))
  }

  return app
}
