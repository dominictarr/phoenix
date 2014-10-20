var mercury     = require('mercury')
var h           = require('mercury').h
var valueEvents = require('./value-events')
var widgets     = require('./widgets')
var com         = require('./com')
var util        = require('../../../lib/util')


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
    if (reply && (reply.type == 'text' || reply.type == 'gui') && notHidden(reply)) {
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
    main = h('div', [main, h('.message-reply', com.publishForm(publishForms[i], state.events, state.user, state.nicknameMap))])
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
    content = h('.gui-post-wrapper.gui-running', [
      new widgets.IframeSandbox(msg.message.html),
    ])
  } else {
    content = h('.gui-post-wrapper', [
      h('.gui-post-runbtn', {'ev-click': valueEvents.click(events.runMsgGui, { id: msg.idStr, run: true })}),
      h('pre.gui-post', h('code',msg.message.html))
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
      renderMsgHeader(msg, events),
      content,
      (events.replyToMsg && events.reactToMsg && events.shareMsg)
          ? (h('p', [
            h('small.message-ctrls', [
              replyStr,
              h('span.pull-right', [
                jsa(icon('comment'), events.replyToMsg, { msg: msg }, { title: 'Reply' }),
                ' ',
                jsa(icon('retweet'), events.shareMsg, { msg: msg }, { title: 'Share' })
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
function renderMsgHeader(msg, events) {
  var stopBtnStr = (msg.isRunning) ? jsa(icon('remove'), events.runMsgGui, { id: msg.idStr, run: false }, { className: 'text-danger pull-right', title: 'Close GUI' }) : ''
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
      h('span.repliesto', [' shared by ', userlink(msg.author, msg.authorNickname)]),
      stopBtnStr
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
      : '',
    stopBtnStr
  ])
}

// summary of reactions in the bottom of messages
function renderMsgReplies(msg, replies) {
  var nReplies = (replies) ? replies.filter(function(r) { return (r.type == 'text' || r.type == 'gui') }).length : 0
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

var dropdown = exports.dropdown = function (text, items) {
  return h('.dropdown', [
    new widgets.DropdownBtn(text),
    h('ul.dropdown-menu', items.map(function(item) {
      return h('li', jsa(item[0], item[1], item[2]))
    }))
  ])
}

var splitdown = exports.splitdown = function (btn, items) {
  return h('.btn-group', [
    btn,
    new widgets.DropdownBtn(),
    h('ul.dropdown-menu', items.map(function(item) {
      return h('li', jsa(item[0], item[1], item[2]))
    }))
  ])
}

var icon = exports.icon = function (i) {
  return h('span.glyphicon.glyphicon-'+i)
}

var stylesheet = exports.stylesheet = function (href) {
  return h('link', { rel: 'stylesheet', href: href })
}

var a = exports.a =  function (href, text, opts) {
  opts = opts || {}
  opts.href = href
  return h('a', opts, text)
}

var jsa = exports.jsa =  function (text, event, evData, opts) {
  opts = opts || {}
  opts['ev-click'] = valueEvents.click(event, evData, { preventDefault: true })
  return a('javascript:void()', text, opts)
}

var img = exports.img = function (src) {
  return h('img', { src: src })
}

var shortHex = exports.shortHex = function (str) {
  return str.slice(0, 6) + '...' + str.slice(-2)
}