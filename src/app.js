var h          = require('hyperscript')
var router     = require('phoenix-router')
var com        = require('./com')
var pages      = require('./pages')
var util       = require('./lib/util')

module.exports = function (ssb, api) {

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

  // toplevel & common methods

  var refreshPage =
  app.refreshPage = function () {
    // clear pending messages
    this.setPendingMessages(0)

    // re-route to setup if needed
    if (!api.getMyProfile().self.name)
      window.location.hash = '#/setup'
    else if (window.location.hash == '#/setup')
      window.location.hash = '#/'

    // run the router
    var route = router(window.location.hash, 'posts')
    this.page.id = route[0]
    this.page.param = route[1]

    // setup suggest options for usernames
    var profiles = 
    this.suggestOptions['@'] = []
    for (var k in api.getAllProfiles()) {
      var name = api.getNameById(k)
      this.suggestOptions['@'].push({ title: name, subtitle: util.shortString(k), value: name })
    }

    // count unread messages
    var readMessages = []
    try { readMessages = JSON.parse(localStorage.readMessages) } catch(e) {}
    this.unreadMessages = this.inbox.reduce(function(acc, mid) {
      return (readMessages.indexOf(mid) === -1) ? (acc + 1) : acc
    }, 0)

    // render the page
    var page = pages[this.page.id]
    if (!page)
      page = pages.notfound
    page(this)
  }

  app.showUserId = function () { 
    swal('Here is your contact id', api.getMyId())
  }

  app.setPendingMessages = function (n) {
    this.pendingMessages = n
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
    if (isInvite) ssb.invite.addMe(id, next) // :TODO: move to phoenix-api
    else api.addEdge('follow', id, next)
      
    var self = this
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
        self.refreshPage()
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

    var self = this
    function done(err) {
      if (err) swal('Error While Publishing', err.message, 'error')
      else self.refreshPage()
    }
  }

  app.setPage = function(page) {
    var el = document.getElementById('page-container')
    el.innerHTML = ''
    el.appendChild(page)
  }

  return app
}
