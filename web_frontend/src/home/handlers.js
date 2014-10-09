var models = require('../lib/models')
var bus = require('../lib/business')
var textareaCaretPosition = require('../lib/textarea-caret-position')
var emojiNamedCharacters = require('emoji-named-characters')

exports.setRoute = function(state, route) {
  route = route.substr(2) || 'feed'
  if (route.indexOf('profile/') === 0) {
    var profid = route.slice(8)
    bus.fetchProfileFeed(state, profid)
  }
  else if (route.indexOf('msg/') === 0) {
    var msgid = route.slice(4)
    bus.fetchFeed(state)
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
  if (!form.parent) {
    if (form.type() == 'text')     bus.publishText(state, str, after)
    else if (form.type() == 'act') bus.publishAction(state, str, after)
  } else {
    if (form.type() == 'text')     bus.publishReply(state, str, form.parent, after)
    else if (form.type() == 'act') bus.publishReaction(state, str, form.parent, after)
  }
  function after(err) {
    if (err) throw err // :TODO: put in gui
    bus.fetchFeed(state) // pull down the update
  }

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

var wordBoundary = /\s/;
var mentionTypes = {'@': 'profile', ':': 'emoji'};
exports.mentionBoxInput = function(state, e) {
  var active = state.suggestBox.active()
  var mentionType

  // are we in a word that starts with @ or :
  var v = e.target.value
  var i = e.target.selectionStart
  for (i; i >= 0; i--) {
    if (wordBoundary.test(v.charAt(i)))
      return state.suggestBox.active.set(false)
    if (v.charAt(i) in mentionTypes && (i === 0 || wordBoundary.test(v.charAt(i - 1)))) {
      mentionType = mentionTypes[v[i]]
      if (mentionType == 'emoji' && !v[i+1]) continue
      break
    }
  }
  if (i < 0) return state.suggestBox.active.set(false)

  // in a mention-word, make sure we have a select box
  if (!active) {
    // calculate position
    var pos = textareaCaretPosition(e.target, i)
    var rects = e.target.getClientRects()
    pos.left += rects[0].left
    pos.top += rects[0].top + 20

    // setup
    state.suggestBox.active.set(true)
    state.suggestBox.selection.set(0)
    state.suggestBox.positionX.set(pos.left)
    state.suggestBox.positionY.set(pos.top)

    // add options
    state.suggestBox.options.splice(0, state.suggestBox.options.getLength())
    if (mentionType == 'profile') {
      state.profiles.forEach(function(profile) {
        state.suggestBox.options.push({ title: profile.nickname, subtitle: shortHex(profile.idStr), value: profile.idStr })
      })
    } else {
      for (var emoji in emojiNamedCharacters) {
        state.suggestBox.options.push({
          image: '/img/emoji/' + emoji + '.png',
          title: emoji,
          subtitle: emoji,
          value: emoji + ':'
        })
      }
    }
  }

  // update the current suggestion value
  var word = v.slice(i+1, e.target.selectionStart)
  state.suggestBox.textValue.set(word)
  state.suggestBox.selection.set(0)
  state.suggestBox.filtered.splice(0, state.suggestBox.filtered.getLength())
  state.suggestBox.options.forEach(function(opt) {
    if (opt.title.indexOf(word) === 0 || opt.subtitle.indexOf(word) === 0)
      state.suggestBox.filtered.push(opt)
  })

  // cancel if there's nothing available
  if (state.suggestBox.filtered.getLength() == 0)
    state.suggestBox.active.set(false)
}

exports.mentionBoxKeypress = function(state, e) {
  if (state.suggestBox.active()) {
    // scroll the selection up/down
    var sel = state.suggestBox.selection()
    if (e.keyCode == 38 || e.keyCode == 40 || e.keyCode == 13)
      e.preventDefault()
    if (e.keyCode == 38 && sel > 0) // up
      state.suggestBox.selection.set(sel - 1)
    if (e.keyCode == 40 && sel < (state.suggestBox.options.getLength() - 1)) // down
      state.suggestBox.selection.set(sel + 1)
    if (e.keyCode == 13) { // enter
      if (state.suggestBox.filtered.getLength()) {
        var choice = state.suggestBox.filtered.get(state.suggestBox.selection())
        if (choice && choice.value) {
          // update the text under the cursor to have the current selection's value
          var v = e.target.value
          var start = e.target.selectionStart
          var end = start
          for (start; start >= 0; start--) {
            if (v.charAt(start) in mentionTypes)
              break
          }
          for (end; end < v.length; end++) {
            if (wordBoundary.test(v.charAt(end)))
              break
          }
          e.target.value = v.slice(0, start + 1) + choice.value + v.slice(end)
        }
      }
      state.suggestBox.active.set(false)
    }
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
  var id = data.msg.idStr
  var form = addPublishForm(state, id, data.msg.id)
  form.type.set('text')
  form.textPlaceholder.set('Reply...')
}

exports.reactToMsg = function(state, data) {
  var id = data.msg.idStr
  var form = addPublishForm(state, id, data.msg.id)
  form.type.set('act')
  form.textPlaceholder.set('Likes, wants, agrees with, etc...')
}

exports.shareMsg = function(state, data) {
  alert('todo https://github.com/pfraze/phoenix/issues/52')
}

function shortHex(str) {
  return str.slice(0, 6) + '..' + str.slice(-2)
}

/*
1: the setTimeout hack in submitPublishForm()
Basically, we need the `state.publishForm.textValue.set(data.publishText)` to run its course
before we can call `state.publishForm.textValue.set('')` and have an effect. This wouldn't be
an issue if the textarea's change event always fired before the submit event, but, because we trigger
with ctrl+enter and are trying not to much directly with the DOM events (Mercury-land) this is our solution.
*/