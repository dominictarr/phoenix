var models = require('../lib/models')
var bus = require('../lib/business')

exports.setRoute = function(state, route) {
  route = route.substr(2) || 'feed'
  if (route.indexOf('profile/') === 0) {
    var profid = route.slice(8)
    bus.fetchProfileFeed(state, profid)
  }
  else if (route == 'network') {
    bus.fetchServers(state)
  }
  else {
    bus.fetchFeed(state)
  }
  state.route.set(route)
}

exports.updatePublishFormTextField = function(state, data) {
  // expand/contract field if there's content in there
  state.publishForm.textFieldRows.set((data.publishText) ? 3 : 1)
  state.publishForm.preview.set(data.publishText)
}

exports.setPublishFormTextField = function(state, data) {
  // update internal data
  state.publishForm.textFieldValue.set(data.publishText)
}

exports.submitPublishForm = function(state, data) {
  // update textarea
  state.publishForm.textFieldValue.set(data.publishText)
  var str = (state.publishForm.textFieldValue()).trim()
  if (!str) return

  // make the post
  bus.publishText(state, str, function(err) {
    if (err) throw err // :TODO: put in gui
    bus.fetchFeed(state) // pull down the update
  })

  // this horrifying setTimeout hack is explained at [1]
  setTimeout(function() {
    // reset the form
    state.publishForm.textFieldValue.set('')
    state.publishForm.textFieldRows.set(1)
    state.publishForm.preview.set('')
  }, 100)
}

exports.addFeed = function(state) {
  var token = prompt('Introduction token of the user:')
  if (!token) return
  bus.addFeed(state, token, function(err) {
    if (err) alert(err.toString())
  })
}

exports.showIntroToken = function(state, data) {
  bus.fetchServers(state, function() {
    // :TODO: it's not actually accurate that the user might be at all of these ndoes
    //        Get an accurate list!
    var servers = state.servers().map(function(s) { return [s.hostname, s.port] })
    var t = JSON.stringify({id: data.id, relays: servers})
    prompt('Intro Token', t)
  })
}

exports.follow = function(state, data) {
  bus.addFeed(state, {id: data.id}, function(err) {
    if (err) alert(err.toString())
  })
}

exports.unfollow = function(state, data) {
  bus.removeFeed(state, data.id, function(err) {
    if (err) alert(err.toString())
  })
}

exports.sync = function(state) {
  state.isSyncing.set(true)
  bus.client.api.syncNetwork(function(err, results) {
    state.isSyncing.set(false)
    if (err) return res.writeHead(500), res.end(err)
    state.lastSync.set(new Date())
    // :TODO:
    // if (results && Object.keys(results).length)
      // backend.local.lastSyncResults = results
    if (state.route() == 'feed')
      bus.fetchFeed(state)
  })
}

exports.addServer = function(state) {
  var address = prompt('Address of the server (address[:port]).')
  if (!address) return
  bus.addServer(state, address, function(err) {
    if (err) alert(err.toString())
  })
}

exports.removeServer = function(state, data) {
  if (!confirm('Are you sure you want to remove this server?')) return
  bus.removeServer(state, [data.hostname, data.port], function(err) {
    if (err) alert(err.toString())
  })
}

exports.toggleLayout = function(state) {
  var curr = state.layout()
  if (curr[0][0] == 'main')
    state.layout.set([['side', 4], ['main', 8]])
  else
    state.layout.set([['main', 7], ['side', 5]])
}

exports.replyToMsg = function(state, data) {
  alert('todo')
}

exports.reactToMsg = function(state, data) {
  alert('todo')
}

exports.shareMsg = function(state, data) {
  alert('todo')
}

/*
1: the setTimeout hack in submitPublishForm()
Basically, we need the `state.publishForm.textFieldValue.set(data.publishText)` to run its course
before we can call `state.publishForm.textFieldValue.set('')` and have an effect. This wouldn't be
an issue if the textarea's change event always fired before the submit event, but, because we trigger
with ctrl+enter and are trying not to much directly with the DOM events (Mercury-land) this is our solution.
*/