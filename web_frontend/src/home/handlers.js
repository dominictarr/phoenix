var pull = require('pull-stream')
var util = require('../lib/util')
var constants = require('./const')
var models = require('../lib/models')
var bus = require('../lib/business')
var ws = require('../lib/ws-rpc')
var sandbox = require('../lib/sandbox')
var textareaCaretPosition = require('../lib/textarea-caret-position')
var emojiNamedCharacters = require('emoji-named-characters')

exports.setRoute = function(state, route) {
  // run any business needed, then update route
  route = route.substr(2) || 'feed'

  if (route == 'inbox') {
    var at = Date.now()
    state.accessTime.set(at)
    localStorage.setItem('accessTime', at)
    state.unreadMessages.set(0)
  }
  
  state.feedView.pagination.start.set(0)
  state.feedView.pagination.end.set(constants.PAGE_SIZE)

  state.route.set(route)
}

function getPublishForm(state, id) {
  var m = state.feedView.publishFormMap()
  return state.feedView.publishForms.get(m[id])
}

function addPublishForm(state, id, parent) {
  var m = state.feedView.publishFormMap()
  if (m[id])
    return state.feedView.publishForms.get(m[id])

  // construct the new form
  var publishForm = models.publishForm({ id: id, parent: parent })
  state.feedView.publishForms.push(publishForm)

  // add to the map
  m[id] = state.feedView.publishForms.getLength() - 1
  state.feedView.publishFormMap.set(m)

  return publishForm
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
      if (form.type() == 'text')        bus.publishText(state, str, after)
      else if (form.type() == 'action') bus.publishAction(state, str, after)
      else if (form.type() == 'gui')    bus.publishGui(state, str, after)
    } else {
      if (form.type() == 'text')        bus.publishReply(state, str, form.parent, after)
      else if (form.type() == 'action') bus.publishReaction(state, str, form.parent, after)
      else if (form.type() == 'gui')    bus.publishGuiply(state, str, form.parent, after)
    }
    function after(err) {
      if (err) {
        if (typeof err.message == 'string' && err.message.indexOf('value out of bounds') === 0) {
          var bytes = /value out of bounds\:(\d+)/.exec(err.message)
          form.error.set('Your post is too big. Posts must be under 1024 bytes, and this is '+((bytes)?bytes[1]:'too many')+' bytes.')
        } else
          console.log(err), form.error.set(err.message || err.toString())
      } else {
        resetForm(state, form)
        bus.syncView(state) // pull down the update
      }
    }
  }, 0)
}

exports.dismissPublishFormError = function(state, data) {
  var m = state.feedView.publishFormMap()
  var form = state.feedView.publishForms.get(m[data.id])
  if (!form)
    return
  form.error.set(false)
}

exports.cancelPublishForm = function(state, data) {
  var m = state.feedView.publishFormMap()
  var form = state.feedView.publishForms.get(m[data.id])
  if (!form)
    return

  if (form.textValue() && !confirm('Are you sure you want to cancel this message?'))
    return

  resetForm(state, form)
}

function resetForm(state, form) {
  if (form.permanent) {
    // reset the form
    form.type.set('text')
    form.textValue.set('')
    form.isRunning.set(false)
    form.error.set(false)
  } else {
    // remove the form
    var m = state.feedView.publishFormMap()
    state.feedView.publishForms.splice(m[form.id], 1, null)
    m[form.id] = undefined
    state.feedView.publishFormMap.set(m)
  }
}

exports.testPublishFormCode = function(state, data) {
  var m = state.feedView.publishFormMap()
  var form = state.feedView.publishForms.get(m[data.id])
  if (!form)
    return

  if (data.restart) {
    form.isRunning.set(false)
    // this setTimout is hacky, but it works
    // it gives mercury time to destroy the iframe (responding to isRunning == false)
    // and gives the textarea blur event time to update the form.textValue
    setTimeout(function() {
      form.isRunning.set(true)
    }, 50)
  } else
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
  var i = e.target.selectionStart - 1
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
        state.suggestBox.options.push({ title: profile.nickname(), subtitle: util.shortString(profile.id), value: profile.id })
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

  var match = []
  if(!word)
    return state.suggestBox.active.set(false)

  for (var i=0; i < state.suggestBox.options.getLength(); i++) {
    var opt = state.suggestBox.options.get(i)
    
    var title = opt.title.indexOf(word), subtitle = opt.subtitle.indexOf(word)

    var rank = (
      title === -1
    ? subtitle : subtitle === -1
    ? title : Math.min(title, subtitle)
    )

    if(rank > -1) {
      opt.rank = rank
      match.push(opt)
    }
  }

  function compare (a, b) {
    return a === b ? 0 : a < b ? -1 : 1
  }

  match = match.sort(function (a, b) {
    return compare(a.rank, b.rank) || compare(a.title, b.title)
  }).slice(0, 20)


  while(match.length)
    state.suggestBox.filtered.push(match.shift())

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
  window.location.hash = '#/msg/' + data.id
}

exports.loadMore = function(state) {
  state.feedView.pagination.end.set(state.feedView.pagination.end() + constants.PAGE_SIZE)
}

exports.addFeed = function(state) {
  var token = prompt('User ID or Invite Code of your contact:')
  if (!token) return
  try {
    // try to parse as an invite structure
    var invite = JSON.parse(token)
    if (!invite.id || invite.id.slice(-8) !== '.blake2s')
      return alert('Invalid ID or invite code')

    if (state.user.followedUsers.indexOf(invite.id) === -1) {
      bus.followUser(state, invite.id, function(err) {
        if (err) alert(err.toString())
        useInvite()
      })
    } else 
      useInvite()

    function useInvite() {
      if (!invite.address || !invite.secret)
        return // no addr or secret? dont bother

      ws.api.phoenix.useInvite(invite, function(err) {
        if (err) alert(err.message)
        bus.syncView(state)
      })
    }
  } catch (e) {
    // is it an id?
    if (token.slice(-8) !== '.blake2s')
      return alert('Invalid ID or invite code')

    if (state.user.followedUsers.indexOf(invite.id) === -1) {
      bus.followUser(state, token, function(err) {
        if (err) alert(err.toString())
      })
    }
  }
}

exports.showId = function(state, data) {
  prompt('User Contact ID', data.id)
}

exports.setUserNickname = function(state) {
  var nickname = prompt('Enter your nickname')
  if (!nickname)
    return
  if (!confirm('Set your nickname to '+nickname+'?'))
    return
  bus.publishProfile(state, nickname, function(err) {
    if (err) alert(err.toString())
    else bus.syncView(state)
  })
}

exports.follow = function(state, data) {
  bus.followUser(state, data.id, function(err) {
    if (err) alert(err.toString())
    else {
      var pm = state.profileMap()
      var profile = state.profiles.get(pm[data.id])
      var nickname = (profile) ? profile().nickname : util.shortString(data.id)

      bubbleNotification(state, 'info',  nickname + ' followed')
    }
  })
}

exports.unfollow = function(state, data) {
  bus.unfollowUser(state, data.id, function(err) {
    if (err) alert(err.toString())
    else {
      var pm = state.profileMap()
      var profile = state.profiles.get(pm[data.id])
      var nickname = (profile) ? profile().nickname : util.shortString(data.id)

      bubbleNotification(state, 'warning', nickname + ' unfollowed')
    }
  })
}

exports.sync = function(state) {
  bus.syncView(state)
}

exports.toggleFilter = function(state, data) {
  state.feedView.filters[data.filter].set(data.set)

  // persist in localstorage
  localStorage.setItem('feed-filters', JSON.stringify({
    shares:      state.feedView.filters.shares(),
    textPosts:   state.feedView.filters.textPosts(),
    actionPosts: state.feedView.filters.actionPosts(),
    guiPosts:    state.feedView.filters.guiPosts(),
    follows:     state.feedView.filters.follows()
  }))
}

exports.toggleUseLocalNetwork = function(state, data) {
  state.useLocalNetwork.set(data.set)
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
  var form = addPublishForm(state, data.msg.id, data.msg.id)
  form.type.set('text')
}

exports.reactToMsg = function(state, data) {
  var form = addPublishForm(state, data.msg.id, data.msg.id)
  form.type.set('action')
}

exports.shareMsg = function(state, data) {
  var id = data.msg.id
  var text = data.msg.content.text
  if (text.length > 100)
    text = text.slice(0, 100) + '...'
  if (!confirm('Share with your followers, "' + text + '"?'))
    return
  bus.publishRebroadcast(state, data.msg, function(err) {
    if (err) throw err // :TODO: put in gui
    bus.syncView(state) // pull down the update
  })
}

exports.runMsgGui = function(state, data) {
  var mm = state.feedView.messageMap()
  var i = mm[data.id]
  if (i == void 0) return
  var msg = state.feedView.messages.get(state.feedView.messages.getLength() - i - 1)
  if (!msg) return

  msg.isRunning.set(data.run)
}

exports.refreshIframe = function() {
  var iframes = document.querySelectorAll('iframe')
  for (var i=0; i < iframes.length; i++) {
    iframes[i].setAttribute('src', iframes[i].src)
    iframes[i].rpc = null
  }
}

exports.onGuipostReply = function(state, data) {
  if (!confirm('This GUI would like to post to your feed. Allow it?'))
    return data.cb(new Error('Access denied'))
  if (data.postType == 'text')        bus.publishReply(state, data.text, data.mid, after)
  else if (data.postType == 'action') bus.publishReaction(state, data.text, data.mid, after)
  else if (data.postType == 'gui')    bus.publishGuiply(state, data.text, data.mid, after)
  function after(err, result) {
    if (!err) bus.syncView(state) // pull down the update
    data.cb(err, result)
  }
}

function bubbleNotification(state, className, msg, t) {
  t = t || 1500

  state.bubble.show.set(true)
  state.bubble.type.set(className)
  state.bubble.msg.set(msg)
  setTimeout(function() {
    state.bubble.show.set(false)
  }, t)
}
