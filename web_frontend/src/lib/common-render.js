var mercury     = require('mercury')
var h           = require('mercury').h
var valueEvents = require('./value-events')
var widgets     = require('./widgets')
var util        = require('../../../lib/util')

var columns = exports.columns = function(parts, layout) {
  parts.blank = ''
  return layout.map(function(col) {
    return h('.col-xs-' + col[1], parts[col[0]])
  })
}

var connStatus = exports.connStatus = function(events, connStatus) {
  if (!connStatus.hasError)
    return h('div')
  return h('.container', h('.alert.alert-danger', connStatus.explanation))
}

var notfound = exports.notfound = function(what, suggestion) {
  return h('div', [
    h('h3', 'Sorry, '+what+' was not found.' + (suggestion || '')),
    h('p', h('small', 'here\'s a cuddly kitty to help you through this trying time')),
    randomcat()
  ])
}

var cats = ['goingdown', 'hophop', 'huuhuuu', 'pillow-spin', 'shred', 'tailbites', 'woahwoah']
var randomcat = exports.randomcat = function() {
  var cat = cats[Math.round(Math.random() * 7)] || cats[0]
  return img('/img/loading/'+cat+'.gif')
}

var mascot = exports.mascot = function(quote) {
  return h('.class', [
    img('/img/logo.png'),
    h('strong', [h('small', quote)])
  ])
}

var feed = exports.feed = function(state, feed, reverse) {
  var messages = feed.map(message.bind(null, state))
  if (reverse) messages.reverse()
  return h('.feed', messages)
}

var message = exports.message = function(state, msg) {
  var events = state.events
  var replyFormMap = state.replyFormMap
  var replyForms = state.replyForms
  var reactFormMap = state.reactFormMap
  var reactForms = state.reactForms

  // main content
  var main
  switch (msg.type.toString()) {
    case 'init': return messageEvent(msg, 'account-created', 'Account created')
    case 'profile': return messageEvent(msg, 'account-change', 'Is now known as ' + util.escapePlain(msg.message.nickname))
    case 'text': main = messageText(events, msg); break
    default: return h('em', 'Unknown message type: ' + util.escapePlain(msg.type.toString()))
  }

  // reply form
  var replyId = msg.authorStr + '-' + msg.sequence
  if (typeof replyFormMap[replyId] != 'undefined') {
    var i = replyFormMap[replyId]
    var replyForm = replyForms[i]
    main = h('div', [
      main,
      h('.message-reply', [
        h('.panel.panel-default', [
          h('.panel-body', h('.reply-preview', new widgets.Markdown(replyForm.preview)))
        ]),
        h('div.reply-publish', { 'ev-event': valueEvents.submit(events.submitReplyForm, { id: replyId }) }, [
          h('p', h('textarea.form-control', {
            name: 'replyText',
            placeholder: 'Reply...',
            rows: replyForm.textFieldRows,
            value: replyForm.textFieldValue,
            'ev-change': mercury.valueEvent(events.setReplyFormTextField, { id: replyId }),
            'ev-keyup': mercury.valueEvent(events.updateReplyFormTextField, { id: replyId })
          })),
          h('button.btn.btn-default', 'Post'),
          ' ',
          jsa(['cancel'], events.cancelReplyForm, { id: replyId }, { className: 'cancel' }),
        ])
      ])
    ])
  }

  // react form
  var reactId = msg.authorStr + '-' + msg.sequence
  if (typeof reactFormMap[reactId] != 'undefined') {
    var i = reactFormMap[reactId]
    var reactForm = reactForms[i]
    main = h('div', [
      main,
      h('.message-reply', [
        h('.phoenix-event', [
          h('span.event-icon.glyphicon.glyphicon-thumbs-up'),
          h('.event-body', [userlink(state.user.id, state.user.nickname), ' ', (reactForm.textFieldValue||'_'), ' this.']),
        ]),
        h('div.reply-publish', { 'ev-event': valueEvents.submit(events.submitReactForm, { id: reactId }) }, [
          h('p', h('input.form-control', {
            name: 'reactText',
            placeholder: 'Likes, dislikes, wants, etc...',
            value: reactForm.textFieldValue,
            'ev-keyup': mercury.valueEvent(events.updateReactFormTextField, { id: reactId })
          })),
          h('button.btn.btn-default', 'Post'),
          ' ',
          jsa(['cancel'], events.cancelReactForm, { id: reactId }, { className: 'cancel' }),
        ])
      ])
    ])
  }

  return main
}

var messageText = exports.messageText = function(events, msg) {
  return h('.panel.panel-default', [
    h('.panel-body', [
      h('p', [
        userlink(msg.author, util.escapePlain(msg.authorNickname)),
        h('small.message-ctrls', [
          ' - ',
          util.prettydate(new Date(msg.timestamp), true)
        ]),
      ]),
      new widgets.Markdown(util.escapePlain(msg.message.plain)),
      (events.replyToMsg && events.reactToMsg && events.shareMsg) ?
        (h('p', [
          h('small.message-ctrls', [
            h('span.pull-right', [
              jsa([icon('pencil'), 'reply'], events.replyToMsg, { msg: msg }),
              ' ',
              jsa([icon('thumbs-up'), 'react'], events.reactToMsg, { msg: msg }),
              ' ',
              jsa([icon('share-alt'), 'share'], events.shareMsg, { msg: msg })
            ])
          ]),
        ])) :
        ''
    ])
  ])
}

var messageEvent = exports.messageEvent = function(msg, type, text) {
  var icon;
  switch (type) {
    case 'account-created': icon = '.glyphicon-home'; break
    case 'account-change': icon = '.glyphicon-user'; break
    default: icon = '.glyphicon-asterisk'
  }
  return h('.phoenix-event', [
    h('span.event-icon.glyphicon'+icon),
    h('.event-body', [userlink(msg.author, util.escapePlain(msg.authorNickname)), ' ' + text]),
  ])
}

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