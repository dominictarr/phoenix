var constants = require('./const')
var models = require('../lib/models')
var bus = require('../lib/business')
var sandbox = require('../lib/sandbox')
var textareaCaretPosition = require('../lib/textarea-caret-position')
var emojiNamedCharacters = require('emoji-named-characters')

exports.setRoute = function(state, route) {
  // run any business needed, then update route
  route = route.substr(2) || 'feed'
  
  state.pagination.start.set(0)
  state.pagination.end.set(constants.PAGE_SIZE)

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
  if (form.preview() !== data.publishText) {
    form.textRows.set((data.publishText) ? 3 : 1)
    form.preview.set(data.publishText)
  }
}

exports.setPublishFormText = function(state, data) {
  var form = getPublishForm(state, data.id)
  if (!form)
    return

  // update internal data
  form.textValue.set(data.publishText)
  form.textRows.set((data.publishText) ? 3 : 1)
  form.preview.set(data.publishText)
  form.setValueTrigger.set(form.setValueTrigger() + 1) // trigger a value overwrite
}

exports.setPublishFormType = function(state, data) {
  var form = getPublishForm(state, data.id)
  if (!form)
    return

  // update internal data
  form.type.set(data.type)
  form.textPlaceholder.set('Publish...')
  form.setValueTrigger.set(form.setValueTrigger() + 1) // trigger a value overwrite
}

exports.submitPublishForm = function(state, data) {
  var form = getPublishForm(state, data.id)
  if (!form)
    return

  // update textarea
  form.textValue.set(data.publishText)
  var str = (form.textValue()).trim()
  if (!str) return

  if (form.type() == 'gui' && !confirm('Post the GUI? (Make sure you test it!)'))
    return

  // wait a tick so that the form.textValue can be process by mercury
  // if we dont, and submitPublishForm was triggered by ctrl+enter...
  // ...then mercury will not realize that form.textValue changed, and wont clear the input
  setTimeout(function() {
    // make the post
    if (!form.parent) {
      if (form.type() == 'text')     bus.publishText(state, str, after)
      else if (form.type() == 'act') bus.publishAction(state, str, after)
      else if (form.type() == 'gui') bus.publishGui(state, str, after)
    } else {
      if (form.type() == 'text')     bus.publishReply(state, str, form.parent, after)
      else if (form.type() == 'act') bus.publishReaction(state, str, form.parent, after)
    }
    function after(err) {
      if (err) throw err // :TODO: put in gui
      bus.fetchFeed(state) // pull down the update
    }

    resetForm(state, form)
  }, 0)
}

exports.cancelPublishForm = function(state, data) {
  var m = state.publishFormMap()
  var form = state.publishForms.get(m[data.id])
  if (!form)
    return

  if (form.preview() && !confirm('Are you sure you want to cancel this message?'))
    return

  resetForm(state, form)
}

function resetForm(state, form) {
  if (form.permanent) {
    // reset the form
    form.type.set('text')
    form.textValue.set('')
    form.textRows.set(1)
    form.preview.set('')
    form.isRunning.set(false)
    form.setValueTrigger.set(form.setValueTrigger() + 1) // trigger a value overwrite
  } else {
    // remove the form
    var m = state.publishFormMap()
    state.publishForms.splice(m[form.id], 1, null)
    m[form.id] = undefined
    state.publishFormMap.set(m)
  }
}

exports.testPublishFormCode = function(state, data) {
  var m = state.publishFormMap()
  var form = state.publishForms.get(m[data.id])
  if (!form)
    return

  form.isRunning.set(data.run)
}

// :TODO: refactor into a value-event
var wordBoundary = /\s/;
var mentionTypes = {'@': 'profile', ':': 'emoji'};
exports.mentionBoxInput = function(state, e) {
  var active = state.suggestBox.active()
  var mentionType

  // are we in a word that starts with @ or :
  var v = e.target.value
  var i = e.target.selectionStart
  for (i; i >= 0; i--) {
    if (wordBoundary.test(v.charAt(i))) {
      if (active)
        state.suggestBox.active.set(false)
      return
    }
    if (v.charAt(i) in mentionTypes && (i === 0 || wordBoundary.test(v.charAt(i - 1)))) {
      mentionType = mentionTypes[v[i]]
      break
    }
  }
  if (i < 0) {
    if (active)
      state.suggestBox.active.set(false)
    return
  }

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
  for (var i=0; i < state.suggestBox.options.getLength() && state.suggestBox.filtered.getLength() < 10; i++) {
    var opt = state.suggestBox.options.get(i)
    if (opt.title.indexOf(word) === 0 || opt.subtitle.indexOf(word) === 0)
      state.suggestBox.filtered.push(opt)
  }

  // cancel if there's nothing available
  if (state.suggestBox.filtered.getLength() == 0)
    state.suggestBox.active.set(false)
}

// :TODO: refactor into a value-event
exports.mentionBoxKeypress = function(state, e) {
  if (state.suggestBox.active()) {
    var sel = state.suggestBox.selection()
    if (e.keyCode == 38 || e.keyCode == 40 || e.keyCode == 13 || e.keyCode == 9|| e.keyCode == 27)
      e.preventDefault()

    // up
    if (e.keyCode == 38 && sel > 0)
      state.suggestBox.selection.set(sel - 1)

    // down
    if (e.keyCode == 40 && sel < (state.suggestBox.options.getLength() - 1))
      state.suggestBox.selection.set(sel + 1)

    // escape
    if (e.keyCode == 27)
      state.suggestBox.active.set(false)

    // enter or tab
    if (e.keyCode == 13 || e.keyCode == 9) {
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
          // :TODO: once this is a value event, set the state instead of mutating the dom's value and firing the change event
          e.target.value = v.slice(0, start + 1) + choice.value + ' ' + v.slice(end)
          // fire the change event
          fireEvent(e.target, 'change')
        }
      }
      state.suggestBox.active.set(false)
    }
  }
}

exports.mentionBoxBlur = function(state) {
  if (state.suggestBox.active())
    state.suggestBox.active.set(false)
}

// TEMPORARY helper
function fireEvent(element,event){
  if (document.createEventObject) {
    // dispatch for IE
    var evt = document.createEventObject();
    return element.fireEvent('on'+event, evt)
  }
  else{
    // dispatch for firefox + others
    var evt = document.createEvent("HTMLEvents");
    evt.initEvent(event, true, true); // event type, bubbling, cancelable
    return !element.dispatchEvent(evt);
  }
}

exports.openMsg = function(state, data) {
  window.location.hash = '#/msg/' + data.idStr
}

exports.loadMore = function(state) {
  state.pagination.end.set(state.pagination.end() + constants.PAGE_SIZE)
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

exports.replyToMsg = function(state, data) {
  var id = data.msg.idStr
  var form = addPublishForm(state, id, data.msg.id)
  form.type.set('text')
  form.textPlaceholder.set('Reply...')
  form.setValueTrigger.set(form.setValueTrigger() + 1) // trigger a value overwrite
}

exports.reactToMsg = function(state, data) {
  var id = data.msg.idStr
  var form = addPublishForm(state, id, data.msg.id)
  form.type.set('act')
  form.textPlaceholder.set('Likes, wants, agrees with, etc...')
  form.setValueTrigger.set(form.setValueTrigger() + 1) // trigger a value overwrite
}

exports.shareMsg = function(state, data) {
  var id = data.msg.idStr
  var text = data.msg.message.plain
  if (text.length > 100)
    text = text.slice(0, 100) + '...'
  if (!confirm('Share with your followers, "' + text + '"?'))
    return
  bus.publishRebroadcast(state, data.msg, function(err) {
    if (err) throw err // :TODO: put in gui
    bus.fetchFeed(state) // pull down the update
  })
}

exports.runMsgGui = function(state, data) {
  var mm = state.messageMap()
  var i = mm[data.id]
  if (i == void 0) return
  var msg = state.feed.get(state.feed.getLength() - i - 1)
  if (!msg) return

  msg.isRunning.set(data.run)
}

function shortHex(str) {
  return str.slice(0, 6) + '..' + str.slice(-2)
}
