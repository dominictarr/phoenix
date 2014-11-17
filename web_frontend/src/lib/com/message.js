var mercury     = require('mercury')
var h           = require('mercury').h
var valueEvents = require('../value-events')
var widgets     = require('../widgets')
var comren      = require('../common-render')
var util        = require('../../../../lib/util')
var publishForm = require('./publish-form').publishForm

// helpers to lookup messages
function lookup(messages, messageMap, entry) {
  var msgi  = messageMap[entry.idStr]
  return (typeof msgi != 'undefined') ? messages[messages.length - msgi - 1] : null
}
function lookupAll(messages, messageMap, index) {
  if (!index || !index.length) return []
  return index.map(lookup.bind(null, messages, messageMap))
}

// feed message renderer
// - `msg`: message object to render
// - `feedView`: app state object
// - `events`: app state object
// - `user`: app state object
// - `nicknameMap`: app state object
// - `isTopRender`: bool, is the message the topmost being rendered now, regardless of its position in the thread?
var message = exports.message = function(msg, feedView, events, user, nicknameMap, isTopRender) {
  var publishFormMap = feedView.publishFormMap
  var publishForms = feedView.publishForms

  // main content
  var main
  switch (msg.content.type) {
    case 'init': return messageEvent(msg, 'account-created', 'Account created', nicknameMap)
    case 'profile': return messageEvent(msg, 'account-change', 'Is now known as ' + msg.content.nickname, nicknameMap)
    case 'follow':
      if (msg.content.$rel == 'follows')
        return messageFollow(msg, nicknameMap)
      return ''
    case 'post':
      var parentMsg = (isTopRender && msg.repliesToLink) ? lookup(feedView.messages, feedView.messageMap, { idStr: msg.repliesToLink.$msg.toString('hex') }) : null
      if (msg.content.postType == 'action')
        return messageEvent(msg, (msg.repliesToLink) ? 'reaction' : 'action', msg.content.text, nicknameMap)
      else if (msg.content.postType == 'gui') {
        // :TODO: gui posts are disabled for now
        // main = messageGui(msg, events, parentMsg, feedView.messages, feedView.messageMap, feedView.replies[msg.idStr], feedView.rebroadcasts[msg.idStr], nicknameMap)
        return ''
      } else
        main = messageText(msg, events, parentMsg, feedView.messages, feedView.messageMap, feedView.replies[msg.idStr], feedView.rebroadcasts[msg.idStr], nicknameMap)
      break
    default:
      return ''
  }

  // reply/react form
  var formId = util.toHexString(msg.id)
  if (typeof publishFormMap[formId] != 'undefined') {
    var i = publishFormMap[formId]
    main = h('div', [main, h('.message-reply', publishForm(publishForms[i], events, user, nicknameMap))])
  }

  return main
}

// message text-content renderer
var messageText = exports.messageText = function(msg, events, parentMsg, messages, messageMap, replies, rebroadcasts, nicknameMap) {
  var content = new widgets.Markdown(msg.content.text, { nicknames: nicknameMap })
  return renderMsgShell(content, msg, events, parentMsg, messages, messageMap, replies, rebroadcasts, nicknameMap)
}

// message gui-content renderer
var messageGui = exports.messageGui = function(msg, events, parentMsg, messages, messageMap, replies, rebroadcasts, nicknameMap) {
  var content
  if (msg.isRunning) {
    content = h('.gui-post-wrapper.gui-running', [
      new widgets.IframeSandbox(msg.content.text, msg.idStr, replies, events.onGuipostReply)
    ])
  } else {
    content = h('.gui-post-wrapper', [
      h('.gui-post-runbtn', {'ev-click': valueEvents.click(events.runMsgGui, { id: msg.idStr, run: true })}),
      h('pre.gui-post', h('code',msg.content.text))
    ])
  }

  // body
  return renderMsgShell(content, msg, events, parentMsg, messages, messageMap, replies, rebroadcasts, nicknameMap)
}

// renders message with the header and footer
function renderMsgShell(content, msg, events, parentMsg, messages, messageMap, replies, rebroadcasts, nicknameMap) {
  replies = lookupAll(messages, messageMap, replies)
  rebroadcasts = lookupAll(messages, messageMap, rebroadcasts)

  var replyStr = renderMsgReplies(msg, replies)
  var reactionsStr = renderMsgReactions(replies, nicknameMap)
  var rebroadcastsStr = renderMsgRebroadcasts(rebroadcasts)  

  var parentHeader
  if (parentMsg) {
    parentHeader = h('.panel-heading', [
      're: ', comren.a('#/msg/'+parentMsg.idStr, new widgets.Markdown(comren.firstWords(parentMsg.content.text, 5), { nicknames: nicknameMap, inline: true }))
    ])
  }

  return h('.panel.panel-default', [
    parentHeader,
    h('.panel-body', [
      renderMsgHeader(msg, events, nicknameMap),
      content,
      (events.replyToMsg && events.reactToMsg && events.shareMsg)
          ? (h('p', [
            h('small.message-ctrls', [
              replyStr,
              h('span.pull-right', [
                comren.jsa(comren.icon('comment'), events.replyToMsg, { msg: msg }, { title: 'Reply' }),
                ' ',
                comren.jsa(comren.icon('retweet'), events.shareMsg, { msg: msg }, { title: 'Share' })
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
function renderMsgHeader(msg, events, nicknameMap) {
  var stopBtnStr = (msg.isRunning) ? comren.jsa(comren.icon('remove'), events.runMsgGui, { id: msg.idStr, run: false }, { className: 'text-danger pull-right', title: 'Close GUI' }) : ''

  if (msg.rebroadcastsLink) {
    // duplicated message
    var author = msg.rebroadcastsLink.$feed
    var authorStr = util.toHexString(author)
    var authorNick = nicknameMap[authorStr] || authorStr
    return h('p', [
      comren.userlink(author, authorNick),
      h('small.message-ctrls', [
        ' - ',
        util.prettydate(new Date(msg.rebroadcastsLink.timestamp||0), true)
      ]),
      h('span.repliesto', [' shared by ', comren.userlink(msg.author, msg.authorNickname)]),
      stopBtnStr
    ])
  }

  // normal message
  return h('p', [
    comren.userlink(msg.author, msg.authorNickname),
    ' ', h('span', { innerHTML: comren.toEmoji(msg.authorStr.slice(0,4), 12) }),
    h('small.message-ctrls', [
      ' - ',
      comren.a('#/msg/'+msg.idStr, util.prettydate(new Date(msg.timestamp), true), { title: 'View message thread' })
    ]),
    stopBtnStr
  ])
}

// summary of reactions in the bottom of messages
function renderMsgReplies(msg, replies) {
  var nReplies = (replies) ? replies.filter(function(r) { return r.content.type == 'post' && (r.content.postType == 'text' || r.content.postType == 'gui') }).length : 0
  return (nReplies) ? comren.a('#/msg/'+msg.idStr, nReplies + ' replies') : ''
}

// list of reactions in the footer of messages
function renderMsgReactions(replies, nicknameMap) {
  reactionsStr = []
  var reactMap = {}
  // create a map of reaction-text -> author-nicknames
  ;(replies || []).forEach(function(reply) {
    if (reply && reply.content.postType == 'action') {
      var react = ''+reply.content.text
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
    var str = [comren.userlink(reactors[0].id, reactors[0].nick)]
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
    rebroadcastsStr.push(comren.userlink(rebroadcasts[0].author, rebroadcasts[0].authorNickname))
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
  var parentLink = ''
  if (msg.repliesToLink) {
    var id = util.toHexString(msg.repliesToLink.$msg)
    parentLink = comren.a('#/msg/'+id, comren.shortHex(id))
  }

  return h('.phoenix-event', [
    h('p.event-body', [
      comren.userlink(msg.author, msg.authorNickname),
      new widgets.Markdown(' ' + text, { inline: true, nicknames: nicknameMap }),
      ' ',
      parentLink
    ])
  ])
}

var messageFollow = exports.messageFollow = function(msg, nicknameMap) {
  var target = util.toHexString(msg.content.$feed)
  var targetNickname = nicknameMap[target] || comren.shortHex(target)

  return h('.phoenix-event', [
    h('p.event-body', [
      comren.userlink(msg.author, msg.authorNickname),
      ' followed ',
      comren.userlink(target, targetNickname)
    ])
  ])
}