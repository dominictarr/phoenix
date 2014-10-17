var mercury     = require('mercury')
var h           = require('mercury').h
var valueEvents = require('./value-events')
var widgets     = require('./widgets')
var util        = require('../../../lib/util')

// attribute hook 
function CounterTriggerHook(value, counter) {
  this.value = value
  this.counter = counter
}
CounterTriggerHook.prototype.hook = function (elem, prop, previous) {
  if (!previous || this.counter !== previous.counter) {
    if (prop == 'value')
      elem.value = this.value // setting .value directly is more reliable
    else
      elem.setAttribute(prop, this.value)
  }
}


// puts the given vdom parts in columns given a `layout` config
// - `parts`: an object mapping names to vdom elements, eg { main: h(...), side: h(...) }
// - `layout`: an array of arrays choosing the layout, eg [['main', 8], ['side', 4]]
var columns = exports.columns = function(parts, layout) {
  parts.blank = ''
  return layout.map(function(col) {
    return h('.col-xs-' + col[1], parts[col[0]])
  })
}

// connection status alert
var connStatus = exports.connStatus = function(events, connStatus) {
  if (!connStatus.hasError)
    return h('div')
  return h('.container', h('.alert.alert-danger', connStatus.explanation))
}

// not found message
var notfound = exports.notfound = function(what, suggestion) {
  return h('div', [
    h('h3', 'Sorry, '+what+' was not found.' + (suggestion || '')),
    h('p', h('small', 'here\'s a cuddly kitty to help you through this trying time')),
    randomcat()
  ])
}

// random cat giferator
var cats = ['goingdown', 'hophop', 'huuhuuu', 'pillow-spin', 'shred', 'tailbites', 'woahwoah']
var randomcat = exports.randomcat = function() {
  var cat = cats[Math.round(Math.random() * 7)] || cats[0]
  return img('/img/loading/'+cat+'.gif')
}

function notHidden(msg) {
  return !msg.hidden
}

// feed view
// - `state`: full application state
// - `feed`: which feed to render
// - `pagination`: { start:, end: }
// - `reverse`: bool, reverse the feed?
var feed = exports.feed = function(state, feed, pagination, reverse) {
  var moreBtn
  feed = feed.filter(notHidden)
  if (reverse) feed.reverse()
  if (pagination) {
    if (pagination.end < feed.length) {
      moreBtn = h('div.load-more', jsa('Load More', state.events.loadMore, undefined, { className: 'btn btn-default' }))
    }
    feed = feed.slice(pagination.start, pagination.end)
  }
  feed = feed.map(message.bind(null, state))
  if (moreBtn)
    feed.push(moreBtn)
  return h('.feed', feed)
}

// message thread view
// - `state`: full application state
// - `msg`: which message's thread to render
var msgThread = exports.msgThread = function(state, msg) {
  return h('.feed', [
    message(state, msg),
    msgThreadTree(state, msg)
  ])
}

// helper, recursively renders reply-tree of a thread
function msgThreadTree(state, msg) {
  // collect replies
  var replies = []
  ;(state.feedReplies[msg.idStr] || []).forEach(function(replyData) {
    // fetch and render message
    var msgi  = state.messageMap[replyData.idStr] // look up index
    var reply = (typeof msgi != 'undefined') ? state.feed[state.feed.length - msgi - 1] : null
    if (reply && reply.type == 'text' && notHidden(reply)) {
      replies.push(message(state, reply))

      // build and render subtree
      var subtree = msgThreadTree(state, reply)
      if (subtree)
        replies.push(subtree)
    }
  })

  if (replies.length)
    return h('.feed.subfeed', replies)
  return ''
}

// feed message renderer
var message = exports.message = function(state, msg) {
  var publishFormMap = state.publishFormMap
  var publishForms = state.publishForms

  // main content
  var main
  switch (msg.type.toString()) {
    case 'init': return mercury.partial(messageEvent, msg, 'account-created', 'Account created', state.nicknameMap)
    case 'profile': return mercury.partial(messageEvent, msg, 'account-change', 'Is now known as ' + msg.message.nickname, state.nicknameMap)
    case 'act': return mercury.partial(messageEvent, msg, (msg.message.repliesTo) ? 'react' : 'act', msg.message.plain, state.nicknameMap)
    case 'text': main = mercury.partial(messageText, msg, state.events, lookupAll(state.feedReplies[msg.idStr]), lookupAll(state.feedRebroadcasts[msg.idStr]), state.nicknameMap); break
    case 'gui': main = mercury.partial(messageGui, msg, state.events, lookupAll(state.feedReplies[msg.idStr]), lookupAll(state.feedRebroadcasts[msg.idStr]), state.nicknameMap); break
    default: return h('em', 'Unknown message type: ' + msg.type)
  }

  // reply/react form
  var formId = util.toHexString(msg.id)
  if (typeof publishFormMap[formId] != 'undefined') {
    var i = publishFormMap[formId]
    main = h('div', [main, h('.message-reply', publishForm(publishForms[i], state.events, state.user, state.nicknameMap))])
  }

  // helper to lookup messages
  function lookupAll(index) {
    if (!index || !index.length) return []
    return index.map(function(entry) {
      var msgi  = state.messageMap[entry.idStr]
      return (typeof msgi != 'undefined') ? state.feed[state.feed.length - msgi - 1] : null
    })
  }

  return main
}

// message text-content renderer
var messageText = exports.messageText = function(msg, events, replies, rebroadcasts, nicknameMap) {
  return renderMsgShell(
    new widgets.Markdown(msg.message.plain, { nicknames: nicknameMap }),
    msg, events, replies, rebroadcasts, nicknameMap
  )
}

// message gui-content renderer
var messageGui = exports.messageGui = function(msg, events, replies, rebroadcasts, nicknameMap) {
  var content
  if (msg.isRunning) {
    content = h('div', [
      new widgets.IframeSandbox({ src: '/gui/' + msg.idStr }),
      jsa([icon('stop'), ' ', 'Stop'], events.runMsgGui, { id: msg.idStr, run: false }, { className: 'btn btn-danger' })
    ])
  } else {
    content = h('div', [
      h('pre', h('code', msg.message.html)),
      jsa([icon('play'), ' ', 'Run'], events.runMsgGui, { id: msg.idStr, run: true }, { className: 'btn btn-primary' })
    ])
  }

  // body
  return renderMsgShell(
    content,
    msg, events, replies, rebroadcasts, nicknameMap
  )
}

// renders message with the header and footer
function renderMsgShell(content, msg, events, replies, rebroadcasts, nicknameMap) {
  var replyStr = renderMsgReplies(msg, replies)
  var reactionsStr = renderMsgReactions(replies, nicknameMap)
  var rebroadcastsStr = renderMsgRebroadcasts(rebroadcasts)  

  return h('.panel.panel-default', [
    h('.panel-body', [
      renderMsgHeader(msg),
      content,
      (events.replyToMsg && events.reactToMsg && events.shareMsg)
          ? (h('p', [
            h('small.message-ctrls', [
              replyStr,
              h('span.pull-right', [
                jsa(icon('pencil'), events.replyToMsg, { msg: msg }, { title: 'Reply' }),
                ' ',
                jsa(icon('hand-up'), events.reactToMsg, { msg: msg }, { title: 'React' }),
                ' ',
                jsa(icon('share-alt'), events.shareMsg, { msg: msg }, { title: 'Share' })
              ])
            ]),
          ]))
          : ''
    ]),
    (reactionsStr.length || rebroadcastsStr.length)
      ? h('.panel-footer', h('small', [reactionsStr, ' ', rebroadcastsStr]))
      : ''
  ])
}

// message header
function renderMsgHeader(msg) {
  var replyIdStr = (msg.message.repliesTo) ? util.toHexString(msg.message.repliesTo.$msg) : ''
  if (msg.message.rebroadcasts) {
    // duplicated message
    var author = msg.message.rebroadcasts.$feed
    var authorStr = util.toHexString(author)
    var authorNick = nicknameMap[authorStr] || authorStr
    return h('p', [
      userlink(author, authorNick),
      h('small.message-ctrls', [
        ' - ',
        util.prettydate(new Date(msg.message.rebroadcasts.timestamp||0), true)
      ]),
      (replyIdStr) ?
        h('span.repliesto', [' in response to ', a('#/msg/'+replyIdStr, shortHex(replyIdStr))])
        : '',
      h('span.repliesto', [' shared by ', userlink(msg.author, msg.authorNickname)])
    ])
  }

  // normal message
  return h('p', [
    userlink(msg.author, msg.authorNickname),
    h('small.message-ctrls', [
      ' - ',
      a('#/msg/'+msg.idStr, util.prettydate(new Date(msg.timestamp), true), { title: 'View message thread' })
    ]),
    (replyIdStr) ?
      h('span.repliesto', [' in response to ', a('#/msg/'+replyIdStr, shortHex(replyIdStr))])
      : ''
  ])
}

// summary of reactions in the bottom of messages
function renderMsgReplies(msg, replies) {
  var nReplies = (replies) ? replies.filter(function(r) { return (r.type == 'text') }).length : 0
  return (nReplies) ? a('#/msg/'+msg.idStr, nReplies + ' replies') : ''
}

// list of reactions in the footer of messages
function renderMsgReactions(replies, nicknameMap) {
  reactionsStr = []
  var reactMap = {}
  // create a map of reaction-text -> author-nicknames
  ;(replies || []).forEach(function(reply) {
    if (reply && reply.type == 'act') {
      var react = ''+reply.message.plain
      if (!reactMap[react])
        reactMap[react] = []
      if (notYetAdded(reactMap[react], reply))
        reactMap[react].push({ id: reply.author, nick: reply.authorNickname })
    }
  })
  function notYetAdded(list, reply) { // helper to remove duplicate reactions by a user
    var nick = reply.authorNickname
    return list.filter(function(r) { return r.nick == nick }).length === 0
  }
  // render the list of reactions
  for (var react in reactMap) {
    // add separators
    if (reactionsStr.length)
      reactionsStr.push(', ')

    // generate the "bob and N others ___ this" phrase
    var reactors = reactMap[react]
    var str = [userlink(reactors[0].id, reactors[0].nick)]
    if (reactors.length > 1) {
      var theOthers = reactors.slice(1).map(function(r) { return r.nick })
      str.push(h('a', { href: 'javascript:void()', title: theOthers.join(', ') }, ' and ' + theOthers.length + ' others'))
    }
    str.push(new widgets.Markdown(' ' + react.trim(), { nicknames: nicknameMap, inline: true }))
    str.push(' this')
    reactionsStr.push(str)
  }
  if (reactionsStr.length) reactionsStr.push('.')
  return reactionsStr
}

// list of rebroadcasts in the footer of messages
function renderMsgRebroadcasts(rebroadcasts) {
  var rebroadcastsStr = []
  if (rebroadcasts.length) {
    rebroadcasts = onePerAuthor(rebroadcasts)
    rebroadcastsStr.push(userlink(rebroadcasts[0].author, rebroadcasts[0].authorNickname))
    if (rebroadcasts.length > 1) {
      var theOthers = rebroadcasts.slice(1).map(function(r) { return r.authorNickname })
      rebroadcastsStr.push(h('a', { href: 'javascript:void()', title: theOthers.join(', ') }, ' and ' + theOthers.length + ' others'))
    }
    rebroadcastsStr.push(' shared this.')
  }
  function onePerAuthor(list) {
    // helper to reduce the list of messages to 1 per author
    var ids = {}
    return list.filter(function(msg) {
      if (!ids[msg.authorStr]) {
        ids[msg.authorStr] = 1
        return true
      }
      return false
    })
  }
  return rebroadcastsStr
}

// message event-content renderer
var messageEvent = exports.messageEvent = function(msg, type, text, nicknameMap) {
  var icon;
  switch (type) {
    case 'account-created': icon = '.glyphicon-home'; break
    case 'account-change': icon = '.glyphicon-user'; break
    case 'react': icon = '.glyphicon-hand-up'; break
    default: icon = '.glyphicon-hand-right'
  }

  var parentLink = ''
  if (msg.message.repliesTo) {
    var id = util.toHexString(msg.message.repliesTo.$msg)
    parentLink = a('#/msg/'+id, shortHex(id))
  }

  return h('.phoenix-event', [
    h('span.event-icon.glyphicon'+icon),
    h('p.event-body', [
      userlink(msg.author, msg.authorNickname),
      new widgets.Markdown(' ' + text, { inline: true, nicknames: nicknameMap }),
      ' ',
      parentLink
    ])
  ])
}

var publishForm = exports.publishForm = function(form, events, user, nicknameMap) {
  if (form.type == 'text') return publishFormText(form, events, user, nicknameMap)
  if (form.type == 'act')  return publishFormAction(form, events, user, nicknameMap)
  if (form.type == 'gui')  return publishFormGui(form, events, user, nicknameMap)
}

function publishFormText(form, events, user, nicknameMap) {
  var isReply = !!form.parent
  var previewDisplay = (!!form.preview) ? 'block' : 'none'
  return  h('.publish-wrapper', [
    h('.panel.panel-default', { style: { display: previewDisplay } }, [
      h('.panel-body', h('.publish-preview', new widgets.Markdown(form.preview, { nicknames: nicknameMap })))
    ]),
    h('div.publish-form', { 'ev-event': valueEvents.submit(events.submitPublishForm, { id: form.id }) }, [
      h('p', h('textarea.form-control', {
        name: 'publishText',
        placeholder: form.textPlaceholder,
        rows: form.textRows || 1,
        value: form.textValue,
        'ev-change': mercury.valueEvent(events.setPublishFormText, { id: form.id }),
        'ev-keyup': mercury.valueEvent(events.updatePublishFormText, { id: form.id }),
        'ev-keydown': [valueEvents.ctrlEnter(events.submitPublishForm, { id: form.id }), events.mentionBoxKeypress],
        'ev-input': events.mentionBoxInput,
        'ev-blur': events.mentionBoxBlur
      })),
      h('span.pull-right', [
        h('strong', jsa('text', events.setPublishFormType, { id: form.id, type: 'text' })),
        ' / ',
        jsa((isReply ? 're' : '') + 'action', events.setPublishFormType, { id: form.id, type: 'act' }),
        (!isReply)
          ? [' / ', jsa('gui', events.setPublishFormType, { id: form.id, type: 'gui' })]
          : ''
      ]),
      h('button.btn.btn-default', 'Post'),
      ' ',
      (!form.permanent) ? jsa(['cancel'], events.cancelPublishForm, { id: form.id }, { className: 'cancel' }) : ''
    ])
  ])
}

function publishFormAction(form, events, user, nicknameMap) {
  var isReply = !!form.parent
  var previewDisplay = (!!form.preview) ? 'block' : 'none'
  var hand = (isReply) ? 'up' : 'right'
  var suggestions = (isReply) ? h('p', [
    h('span.btn-group', [suggestBtn('Like', 'liked'), suggestBtn('Dislike', 'disliked')]),
    ' ', h('span.btn-group', [suggestBtn('Love', 'loved'), suggestBtn('Hate', 'hated')]),
    ' ', h('span.btn-group', [suggestBtn('Agree', 'agreed with'), suggestBtn('Disagree', 'disagreed with')]),
    ' ', h('span.btn-group', [suggestBtn('Confirm', 'confirmed'), suggestBtn('Deny', 'denied')])
  ]) : ''
  var preview = (isReply) ? (form.preview + ' this.') : form.preview

  return h('.publish-wrapper', [
    h('.phoenix-event', { style: { display: previewDisplay } }, [
      h('span.event-icon.glyphicon.glyphicon-hand-'+hand),
      h('p.event-body', [userlink(user.id, user.nickname), ' ', new widgets.Markdown(preview, { inline: true, nicknames: nicknameMap })])
    ]),      
    h('div.publish-form', { 'ev-event': valueEvents.submit(events.submitPublishForm, { id: form.id }) }, [
      suggestions,
      h('p', h('input.form-control', {
        name: 'publishText',
        // placeholder: form.textPlaceholder,
        value: new CounterTriggerHook(form.textValue||'', form.setValueTrigger),
        'ev-change': mercury.valueEvent(events.setPublishFormText, { id: form.id }),
        'ev-keyup': [
          events.mentionBoxKeypress,
          mercury.valueEvent(events.updatePublishFormText, { id: form.id }), 
          valueEvents.ctrlEnter(events.submitPublishForm, { id: form.id })
        ],
        'ev-input': events.mentionBoxInput,
        'ev-blur': events.mentionBoxBlur
      })),
      h('span.pull-right', [
        jsa('text', events.setPublishFormType, { id: form.id, type: 'text' }),
        ' / ',
        h('strong', jsa((isReply ? 're' : '') + 'action', events.setPublishFormType, { id: form.id, type: 'act' })),
        (!isReply)
          ? [' / ', jsa('gui', events.setPublishFormType, { id: form.id, type: 'gui' })]
          : ''
      ]),
      h('button.btn.btn-default', 'Post'),
      ' ',
      (!form.permanent) ? jsa(['cancel'], events.cancelPublishForm, { id: form.id }, { className: 'cancel' }) : ''
    ])
  ])

  function suggestBtn(label, text) {
    return jsa(label, events.setPublishFormText, { id: form.id, publishText: text }, { className: 'btn btn-default btn-xs' })
  }
}

var canvasSampleCode = '<canvas id="canvas" width="150" height="100"></canvas>\n<script>\n  var ctx = canvas.getContext("2d");\n\n  ctx.fillStyle = "rgb(200,0,0)";\n  ctx.fillRect (10, 10, 55, 50);\n\n  ctx.fillStyle = "rgba(0, 0, 200, 0.5)";\n  ctx.fillRect (30, 30, 55, 50);\n</script>'

function publishFormGui(form, events, user, nicknameMap) {
  var previewDisplay = (!!form.preview) ? 'block' : 'none'
  var preview
  if (!form.isRunning)
    preview = 'Press "Test" to try your HTML'
  else
    preview = new widgets.IframeSandbox({ srcdoc: form.textValue })

  var isReply = !!form.parent
  return  h('.publish-wrapper', [
    h('.panel.panel-default', { style: { display: previewDisplay } }, [
      h('.panel-body', h('.publish-preview', preview))
    ]),
    h('div.publish-form', { 'ev-event': valueEvents.submit(events.submitPublishForm, { id: form.id }) }, [
      h('p', ['Snippet: ', jsa('canvas', events.setPublishFormText, { id: form.id, publishText: canvasSampleCode })]),
      h('p', h('textarea.form-control', {
        name: 'publishText',
        rows: (!!form.preview) ? 10 : 1,
        value: form.textValue,
        'ev-change': mercury.valueEvent(events.setPublishFormText, { id: form.id }),
        'ev-keyup': mercury.valueEvent(events.updatePublishFormText, { id: form.id })
      })),
      h('span.pull-right', [
        jsa('text', events.setPublishFormType, { id: form.id, type: 'text' }),
        ' / ',
        jsa((isReply ? 're' : '') + 'action', events.setPublishFormType, { id: form.id, type: 'act' }),
        ' / ',
        h('strong', jsa('gui', events.setPublishFormType, { id: form.id, type: 'gui' }))
      ]),
      (form.isRunning)
        ? h('button.btn.btn-danger',  {'ev-click': valueEvents.click(events.testPublishFormCode, { id: form.id, run: false })}, [icon('stop'),' Stop'])
        : h('button.btn.btn-success', {'ev-click': valueEvents.click(events.testPublishFormCode, { id: form.id, run: true })},  [icon('play'),' Test'])
        ,
      ' ',
      h('button.btn.btn-default', 'Post'),
      ' ',
      (!form.permanent) ? jsa(['cancel'], events.cancelPublishForm, { id: form.id }, { className: 'cancel' }) : ''
    ])
  ])
}

// Helper Elements
// ===============

var syncButton = exports.syncButton = function(events, isSyncing) {
  if (isSyncing) {
    return h('button.btn.btn-default', { disabled: true }, 'Syncing...')
  }
  return h('button.btn.btn-default', { 'ev-click': events.sync }, 'Sync')
}

var userlink = exports.userlink = function(id, text, opts) {
  opts = opts || {}
  opts.className = (opts.className || '') + ' user-link'
  var idStr = util.toHexString(id)
  return a('#/profile/'+idStr, text, opts)
}

function dropdown(text, items) {
  return h('.dropdown', [
    new widgets.DropdownBtn(text),
    h('ul.dropdown-menu', items.map(function(item) {
      return h('li', jsa(item[0], item[1], item[2]))
    }))
  ])
}

function splitdown(btn, items) {
  return h('.btn-group', [
    btn,
    new widgets.DropdownBtn(),
    h('ul.dropdown-menu', items.map(function(item) {
      return h('li', jsa(item[0], item[1], item[2]))
    }))
  ])
}

function icon(i) {
  return h('span.glyphicon.glyphicon-'+i)
}
function stylesheet(href) {
  return h('link', { rel: 'stylesheet', href: href })
}
function a(href, text, opts) {
  opts = opts || {}
  opts.href = href
  return h('a', opts, text)
}
function jsa(text, event, evData, opts) {
  opts = opts || {}
  opts['ev-click'] = valueEvents.click(event, evData, { preventDefault: true })
  return a('javascript:void()', text, opts)
}
function img(src) {
  return h('img', { src: src })
}

function shortHex(str) {
  return str.slice(0, 6) + '...' + str.slice(-2)
}