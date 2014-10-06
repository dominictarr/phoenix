var h       = require('mercury').h
var widgets = require('./widgets')
var util    = require('../../../lib/util')

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

var feed = exports.feed = function(feed, rev) {
  var messages = feed.map(message)
  if (rev) messages.reverse()
  return h('.feed', messages)
}

var message = exports.message = function(msg) {
  var content;
  switch (msg.type.toString()) {
    case 'init': return messageEvent(msg, 'account-created', 'Account created')
    case 'profile': return messageEvent(msg, 'account-change', 'Is now known as ' + util.escapePlain(msg.message.nickname))
    case 'text': return messageText(msg)
    default: return h('em', 'Unknown message type: ' + util.escapePlain(msg.type.toString()))
  }
}

var messageText = exports.messageText = function(msg) {
  return h('.panel.panel-default', [
    h('.panel-body', [
      h('p', [userlink(msg.author, util.escapePlain(msg.authorNickname)), h('small', ' - ' + util.prettydate(new Date(msg.timestamp), true))]),
      new widgets.Markdown(util.escapePlain(msg.message.plain))
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

function stylesheet(href) {
  return h('link', { rel: 'stylesheet', href: href })
}
function a(href, text, opts) {
  opts = opts || {}
  opts.href = href
  return h('a', opts, text)
}
function img(src) {
  return h('img', { src: src })
}