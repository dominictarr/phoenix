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

function getPublishForm(state, id) {
  var m = state.publishFormMap()
  return state.publishForms.get(m[id])
}

function addPublishForm(state, id, parent) {
  var m = state.publishFormMap()
  if (m[id])
    return state.publishForms.get(m[id])

  // construct the new form
  var publishForm = models.publishForm({ id: id, parent: parent })
  state.publishForms.push(publishForm)

  // add to the map
  m[id] = state.publishForms.getLength() - 1
  state.publishFormMap.set(m)

  return publishForm
}

exports.updatePublishFormText = function(state, data) {
  var form = getPublishForm(state, data.id)
  if (!form)
    return

  // expand/contract field if there's content in there
  switch (form.type()) {
    case 'text':
      form.textRows.set((data.publishText) ? 3 : 1)
      form.preview.set(data.publishText)
      break
    case 'act':
      form.preview.set(data.publishText)
      form.textValue.set(data.publishText)
      break
  }
}

exports.setPublishFormText = function(state, data) {
  var form = getPublishForm(state, data.id)
  if (!form)
    return

  // update internal data
  form.textValue.set(data.publishText)
}

exports.setPublishFormType = function(state, data) {
  var form = getPublishForm(state, data.id)
  if (!form)
    return

  // update internal data
  form.type.set(data.type)
  form.textPlaceholder.set('Publish...')
}

exports.submitPublishForm = function(state, data) {
  var form = getPublishForm(state, data.id)
  if (!form)
    return

  // update textarea
  form.textValue.set(data.publishText)
  var str = (form.textValue()).trim()
  if (!str) return

  // make the post
  alert(str)
  // :TODO:
  /*bus.publishText(state, str, function(err) {
    if (err) throw err // :TODO: put in gui
    bus.fetchFeed(state) // pull down the update
  })*/

  // this horrifying setTimeout hack is explained at [1]
  setTimeout(function() {
    if (form.permanent) {
      // reset the form
      form.textValue.set('')
      form.textRows.set(1)
      form.preview.set('')
    } else {
      // remove the form
      var m = state.publishFormMap()
      state.publishForms.splice(m[form.id], 1, null)
      m[data.id] = undefined
      state.publishFormMap.set(m)
    }
  }, 100)
}

exports.cancelPublishForm = function(state, data) {
  var m = state.publishFormMap()
  var form = state.publishForms.get(m[data.id])
  if (!form)
    return

  if (form.preview() && !confirm('Are you sure you want to cancel this message?'))
    return

  if (form.permanent) {
    // reset the form
    form.textValue.set('')
    form.textRows.set(1)
    form.preview.set('')
  } else {
    // remove the form
    state.publishForms.splice(m[data.id], 1, null)
    m[data.id] = undefined
    state.publishFormMap.set(m)
  }
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
  var id = data.msg.authorStr + '-' + data.msg.sequence
  var form = addPublishForm(state, id, 'TODO')
  form.type.set('text')
  form.textPlaceholder.set('Reply...')
}

exports.reactToMsg = function(state, data) {
  var id = data.msg.authorStr + '-' + data.msg.sequence
  var form = addPublishForm(state, id, 'TODO')
  form.type.set('act')
  form.textPlaceholder.set('Likes, wants, agrees with, etc...')
}

exports.shareMsg = function(state, data) {
  alert('todo https://github.com/pfraze/phoenix/issues/52')
}

/*
1: the setTimeout hack in submitPublishForm()
Basically, we need the `state.publishForm.textValue.set(data.publishText)` to run its course
before we can call `state.publishForm.textValue.set('')` and have an effect. This wouldn't be
an issue if the textarea's change event always fired before the submit event, but, because we trigger
with ctrl+enter and are trying not to much directly with the DOM events (Mercury-land) this is our solution.
*/