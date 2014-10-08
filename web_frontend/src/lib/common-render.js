var mercury     = require('mercury')
var h           = require('mercury').h
var valueEvents = require('./value-events')
var widgets     = require('./widgets')
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

// felix the phoenix
var mascot = exports.mascot = function(quote) {
  return h('.class', [
    img('/img/logo.png'),
    h('strong', [h('small', quote)])
  ])
}

// feed view
// - `state`: full application state
// - `feed`: which feed to render
// - `reverse`: bool, reverse the feed?
var feed = exports.feed = function(state, feed, reverse) {
  var messages = feed.map(message.bind(null, state))
  if (reverse) messages.reverse()
  return h('.feed', messages)
}

// feed message renderer
var message = exports.message = function(state, msg) {
  var events = state.events
  var publishFormMap = state.publishFormMap
  var publishForms = state.publishForms

  // main content
  var main
  switch (msg.type.toString()) {
    case 'init': return messageEvent(msg, 'account-created', 'Account created')
    case 'profile': return messageEvent(msg, 'account-change', 'Is now known as ' + msg.message.nickname)
    case 'act': return messageEvent(msg, (msg.message.repliesTo) ? 'react' : 'act', msg.message.plain)
    case 'text': main = messageText(events, msg); break
    default: return h('em', 'Unknown message type: ' + msg.type)
  }

  // reply/react form
  var formId = util.toHexString(msg.id)
  if (typeof publishFormMap[formId] != 'undefined') {
    var i = publishFormMap[formId]
    main = h('div', [main, h('.message-reply', publishForm(state, publishForms[i]))])
  }

  return main
}

// message text-content renderer
var messageText = exports.messageText = function(events, msg) {
  return h('.panel.panel-default', [
    h('.panel-body', [
      h('p', [
        userlink(msg.author, util.escapePlain(msg.authorNickname)),
        h('small.message-ctrls', [
          ' - ',
          util.prettydate(new Date(msg.timestamp), true)
        ]),
        (msg.message.repliesTo) ?
          h('span.repliesto', [' in response to ', a('javascript:void()', shortHex(msg.message.repliesTo.$msg))])
          : '',
      ]),
      new widgets.Markdown(util.escapePlain(msg.message.plain)),
      (events.replyToMsg && events.reactToMsg && events.shareMsg) ?
        (h('p', [
          h('small.message-ctrls', [
            a('javascript:void()', '0 replies / 0 reactions'),
            h('span.pull-right', [
              jsa([icon('pencil'), 'reply'], events.replyToMsg, { msg: msg }),
              ' ',
              jsa([icon('hand-up'), 'react'], events.reactToMsg, { msg: msg }),
              ' ',
              jsa([icon('share-alt'), 'share'], events.shareMsg, { msg: msg })
            ])
          ]),
        ])) :
        ''
    ])
  ])
}

// message event-content renderer
var messageEvent = exports.messageEvent = function(msg, type, text) {
  var icon;
  switch (type) {
    case 'account-created': icon = '.glyphicon-home'; break
    case 'account-change': icon = '.glyphicon-user'; break
    case 'react': icon = '.glyphicon-hand-up'; break
    default: icon = '.glyphicon-hand-right'
  }
  return h('.phoenix-event', [
    h('span.event-icon.glyphicon'+icon),
    h('.event-body', [
      h('p', [
        h('small.message-ctrls', [
          util.prettydate(new Date(msg.timestamp), true)
        ]),
        (msg.message.repliesTo) ?
          h('span.repliesto', [' in response to ', a('javascript:void()', shortHex(msg.message.repliesTo.$msg))])
          : '',
      ]),
      h('p', [userlink(msg.author, util.escapePlain(msg.authorNickname)), ' ' + text])
    ]),
  ])
}

var publishForm = exports.publishForm = function(state, form) {
  if (form.type == 'text') {
    var previewDisplay = (!!form.preview) ? 'block' : 'none'
    return  h('.publish-wrapper', [
      h('.panel.panel-default', { style: { display: previewDisplay } }, [
        h('.panel-body', h('.publish-preview', new widgets.Markdown(form.preview)))
      ]),
      h('div.publish-form', { 'ev-event': valueEvents.submit(state.events.submitPublishForm, { id: form.id }) }, [
        h('p', h('textarea.form-control', {
          name: 'publishText',
          placeholder: form.textPlaceholder,
          rows: form.textRows,
          value: form.textValue,
          'ev-change': mercury.valueEvent(state.events.setPublishFormText, { id: form.id }),
          'ev-keyup': mercury.valueEvent(state.events.updatePublishFormText, { id: form.id })
        })),
        h('button.btn.btn-default', 'Post'),
        ' ',
        (!form.permanent) ? jsa(['cancel'], state.events.cancelPublishForm, { id: form.id }, { className: 'cancel' }) : '',
        h('span.pull-right', [
          h('strong', jsa('text', state.events.setPublishFormType, { id: form.id, type: 'text' })),
          ' / ',
          jsa('action', state.events.setPublishFormType, { id: form.id, type: 'act' })
        ])
      ])
    ])
  }
  if (form.type == 'act') {
    var previewDisplay = (!!form.textValue) ? 'block' : 'none'
    var hand = (form.parent) ? 'up' : 'right'
    return h('.publish-wrapper', [
      h('.phoenix-event', { style: { display: previewDisplay } }, [
        h('span.event-icon.glyphicon.glyphicon-hand-'+hand),
        (form.parent) ?
          h('.event-body', [userlink(state.user.id, state.user.nickname), ' ', form.textValue, ' this']) :
          h('.event-body', [userlink(state.user.id, state.user.nickname), ' ', form.textValue]),
      ]),
      h('div.publish-form', { 'ev-event': valueEvents.submit(state.events.submitPublishForm, { id: form.id }) }, [
        h('p', h('input.form-control', {
          name: 'publishText',
          placeholder: form.textPlaceholder,
          value: form.textValue,
          'ev-keyup': mercury.valueEvent(state.events.updatePublishFormText, { id: form.id })
        })),
        h('button.btn.btn-default', 'Post'),
        ' ',
        (!form.permanent) ? jsa(['cancel'], state.events.cancelPublishForm, { id: form.id }, { className: 'cancel' }) : '',
        h('span.pull-right', [
          jsa('text', state.events.setPublishFormType, { id: form.id, type: 'text' }),
          ' / ',
          h('strong', jsa('action', state.events.setPublishFormType, { id: form.id, type: 'act' }))
        ])
      ])
    ])
  }
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

function shortHex(buf) {
  return util.toHexString(buf).slice(0, 6) + '...'
}