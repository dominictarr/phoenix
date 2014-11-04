var mercury     = require('mercury')
var h           = require('mercury').h
var valueEvents = require('../value-events')
var widgets     = require('../widgets')
var comren      = require('../common-render')
var util        = require('../../../../lib/util')
var publishForm = require('./publish-form').publishForm

// feed message renderer
// - `state`: full app state object
// - `msg`: message object to render
// - `showParent`: bool, should the parent of replies be inlined in the header?
var message = exports.message = function(state, msg, showParent) {
  var publishFormMap = state.publishFormMap
  var publishForms = state.publishForms

  // main content
  var main
  switch (msg.content.type) {
    case 'init': return mercury.partial(messageEvent, msg, 'account-created', 'Account created', state.nicknameMap)
    case 'profile': return mercury.partial(messageEvent, msg, 'account-change', 'Is now known as ' + msg.content.nickname, state.nicknameMap)
    case 'follow':
      if (msg.content.$rel == 'follows')
        return mercury.partial(messageFollow, msg, state.nicknameMap)
      return ''
    case 'post':
      var parentMsg = (showParent && msg.content.repliesTo) ? lookup({ idStr: msg.content.repliesTo.$msg.toString('hex') }) : null
      if (msg.content.postType == 'action')
        return mercury.partial(messageEvent, msg, (msg.content.repliesTo) ? 'reaction' : 'action', msg.content.text, state.nicknameMap)
      else if (msg.content.postType == 'gui')
        main = mercury.partial(messageGui, msg, state.events, parentMsg, lookupAll(state.feedReplies[msg.idStr]), lookupAll(state.feedRebroadcasts[msg.idStr]), state.nicknameMap)
      else
        main = mercury.partial(messageText, msg, state.events, parentMsg, lookupAll(state.feedReplies[msg.idStr]), lookupAll(state.feedRebroadcasts[msg.idStr]), state.nicknameMap)
      break
    default:
      return ''
  }

  // reply/react form
  var formId = util.toHexString(msg.id)
  if (typeof publishFormMap[formId] != 'undefined') {
    var i = publishFormMap[formId]
    main = h('div', [main, h('.message-reply', publishForm(publishForms[i], state.events, state.user, state.nicknameMap))])
  }

  // helper to lookup messages
  function lookup(entry) {
    var msgi  = state.messageMap[entry.idStr]
    return (typeof msgi != 'undefined') ? state.feed[state.feed.length - msgi - 1] : null
  }
  function lookupAll(index) {
    if (!index || !index.length) return []
    return index.map(lookup)
  }

  return main
}

// message text-content renderer
var messageText = exports.messageText = function(msg, events, parentMsg, replies, rebroadcasts, nicknameMap) {
  var content = new widgets.Markdown(msg.content.text, { nicknames: nicknameMap })
  return renderMsgShell(content, msg, events, parentMsg, replies, rebroadcasts, nicknameMap)
}

// message gui-content renderer
var messageGui = exports.messageGui = function(msg, events, parentMsg, replies, rebroadcasts, nicknameMap) {
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
  return renderMsgShell(content, msg, events, parentMsg, replies, rebroadcasts, nicknameMap)
}

// renders message with the header and footer
function renderMsgShell(content, msg, events, parentMsg, replies, rebroadcasts, nicknameMap) {
  var replyStr = renderMsgReplies(msg, replies)
  var reactionsStr = renderMsgReactions(replies, nicknameMap)
  var rebroadcastsStr = renderMsgRebroadcasts(rebroadcasts)  

  var parentHeader
  if (parentMsg) {
    parentHeader = h('.panel-heading', [
      renderMsgHeader(parentMsg, events, nicknameMap, true),
      new widgets.Markdown(parentMsg.content.text, { nicknames: nicknameMap })
    ])
  }

  return h('.panel.panel-default', [
    parentHeader,
    h('.panel-body', [
      renderMsgHeader(msg, events, nicknameMap, (!!msg.content.repliesTo && !parentMsg)),
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
function renderMsgHeader(msg, events, nicknameMap, showInResponseTo) {
  var replyIdStr = (showInResponseTo && msg.content.repliesTo) ? util.toHexString(msg.content.repliesTo.$msg) : ''
  var stopBtnStr = (msg.isRunning) ? comren.jsa(comren.icon('remove'), events.runMsgGui, { id: msg.idStr, run: false }, { className: 'text-danger pull-right', title: 'Close GUI' }) : ''

  if (msg.content.rebroadcasts) {
    // duplicated message
    var author = msg.content.rebroadcasts.$feed
    var authorStr = util.toHexString(author)
    var authorNick = nicknameMap[authorStr] || authorStr
    return h('p', [
      comren.userlink(author, authorNick),
      h('small.message-ctrls', [
        ' - ',
        util.prettydate(new Date(msg.content.rebroadcasts.timestamp||0), true)
      ]),
      (replyIdStr) ?
        h('span.repliesto', [' in response to ', comren.a('#/msg/'+replyIdStr, comren.shortHex(replyIdStr))])
        : '',
      h('span.repliesto', [' shared by ', comren.userlink(msg.author, msg.authorNickname)]),
      stopBtnStr
    ])
  }

  // normal message
  return h('p', [
    comren.userlink(msg.author, msg.authorNickname),
    h('small.message-ctrls', [
      ' - ',
      comren.a('#/msg/'+msg.idStr, util.prettydate(new Date(msg.timestamp), true), { title: 'View message thread' })
    ]),
    (replyIdStr) ?
      h('span.repliesto', [' in response to ', comren.a('#/msg/'+replyIdStr, comren.shortHex(replyIdStr))])
      : '',
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
  if (msg.content.repliesTo) {
    var id = util.toHexString(msg.content.repliesTo.$msg)
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