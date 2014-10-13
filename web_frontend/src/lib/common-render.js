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

// felix the phoenix
var mascot = exports.mascot = function(quote) {
  return h('.class', [
    img('/img/logo.png'),
    h('strong', [h('small', quote)])
  ])
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

// subfeed view
// - `state`: full application state
// - `feed`: which feed to render
// - `reverse`: bool, reverse the feed?
var subfeed = exports.subfeed = function(state, feed, reverse) {
  var messages = feed.filter(notHidden).map(message.bind(null, state))
  if (reverse) messages.reverse()
  return h('.feed.subfeed', messages)
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
    case 'text': main = mercury.partial(messageText, msg, state.events, state.feedReplies[msg.idStr], state.feedRebroadcasts[msg.idStr], state.nicknameMap); break
    default: return h('em', 'Unknown message type: ' + msg.type)
  }

  // reply/react form
  var formId = util.toHexString(msg.id)
  if (typeof publishFormMap[formId] != 'undefined') {
    var i = publishFormMap[formId]
    main = h('div', [main, h('.message-reply', publishForm(publishForms[i], state.events, state.user, state.nicknameMap))])
  }

  return main
}

// message text-content renderer
var messageText = exports.messageText = function(msg, events, replies, rebroadcasts, nicknameMap) {
  // header
  var header
  var replyIdStr = (msg.message.repliesTo) ? util.toHexString(msg.message.repliesTo.$msg) : ''
  if (msg.message.rebroadcasts) {
    // duplicated message
    var author = msg.message.rebroadcasts.$feed
    var authorStr = util.toHexString(author)
    var authorNick = nicknameMap[authorStr] || authorStr
    header = h('p', [
      userlink(author, util.escapePlain(authorNick)),
      h('small.message-ctrls', [
        ' - ',
        util.prettydate(new Date(msg.message.rebroadcasts.timestamp||0), true)
      ]),
      (replyIdStr) ?
        h('span.repliesto', [' in response to ', a('#/msg/'+replyIdStr, shortHex(replyIdStr))])
        : '',
      h('span.repliesto', [' shared by ', userlink(msg.author, util.escapePlain(msg.authorNickname))])
    ])
  } else {
    // normal message
    header = h('p', [
      userlink(msg.author, util.escapePlain(msg.authorNickname)),
      h('small.message-ctrls', [
        ' - ',
        util.prettydate(new Date(msg.timestamp), true)
      ]),
      (replyIdStr) ?
        h('span.repliesto', [' in response to ', a('#/msg/'+replyIdStr, shortHex(replyIdStr))])
        : '',
    ])
  }

  // stats
  var nReplies = (replies) ? replies.filter(function(r) { return (r.type == 'text') }).length : 0
  var nReacts  = (replies) ? replies.filter(function(r) { return (r.type == 'act') }).length : 0
  var nDups    = (rebroadcasts) ? rebroadcasts.length : 0
  var stats = []
  if (nReplies) stats.push(nReplies + ' replies')
  if (nReacts)  stats.push(nReacts + ' reactions')
  if (nDups)    stats.push(nDups + ' shares')
  if (stats.length)
    stats = a('#/msg/'+msg.idStr, stats.join(' '))
  else
    stats = ''

  return h('.panel.panel-default', [
    h('.panel-body', [
      header,
      new widgets.Markdown(msg.message.plain, { nicknames: nicknameMap }),
      (events.replyToMsg && events.reactToMsg && events.shareMsg) ?
        (h('p', [
          h('small', [
            stats,
            h('span.message-ctrls.pull-right', [
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
var messageEvent = exports.messageEvent = function(msg, type, text, nicknameMap) {
  var icon;
  switch (type) {
    case 'account-created': icon = '.glyphicon-home'; break
    case 'account-change': icon = '.glyphicon-user'; break
    case 'react': icon = '.glyphicon-hand-up'; break
    default: icon = '.glyphicon-hand-right'
  }
  var replyIdStr = (msg.message.repliesTo) ? util.toHexString(msg.message.repliesTo.$msg) : ''
  return h('.phoenix-event', [
    h('span.event-icon.glyphicon'+icon),
    h('.event-body', [
      h('p', [
        h('small.message-ctrls', [
          util.prettydate(new Date(msg.timestamp), true)
        ]),
        (replyIdStr) ?
          h('span.repliesto', [' in response to ', a('#/msg/'+replyIdStr, shortHex(replyIdStr))])
          : '',
      ]),
      h('p', [userlink(msg.author, util.escapePlain(msg.authorNickname)), new widgets.Markdown(' ' + text, { inline: true, nicknames: nicknameMap })])
    ]),
  ])
}

var publishForm = exports.publishForm = function(form, events, user, nicknameMap) {
  if (form.type == 'text') {
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
          'ev-input': events.mentionBoxInput
        })),
        h('button.btn.btn-default', 'Post'),
        ' ',
        (!form.permanent) ? jsa(['cancel'], events.cancelPublishForm, { id: form.id }, { className: 'cancel' }) : '',
        h('span.pull-right', [
          h('strong', jsa('text', events.setPublishFormType, { id: form.id, type: 'text' })),
          ' / ',
          jsa('action', events.setPublishFormType, { id: form.id, type: 'act' })
        ])
      ])
    ])
  }
  if (form.type == 'act') {
    var previewDisplay = (!!form.preview) ? 'block' : 'none'
    var hand = (form.parent) ? 'up' : 'right'
    return h('.publish-wrapper', [
      h('.phoenix-event', { style: { display: previewDisplay } }, [
        h('span.event-icon.glyphicon.glyphicon-hand-'+hand),
        h('.event-body', [userlink(user.id, user.nickname), ' ', new widgets.Markdown(form.preview, { inline: true, nicknames: nicknameMap })])
      ]),      
      h('div.publish-form', { 'ev-event': valueEvents.submit(events.submitPublishForm, { id: form.id }) }, [
        h('p', h('input.form-control', {
          name: 'publishText',
          placeholder: form.textPlaceholder,
          value: new CounterTriggerHook(form.textValue||'', form.setValueTrigger),
          'ev-change': mercury.valueEvent(events.setPublishFormText, { id: form.id }),
          'ev-keyup': [
            events.mentionBoxKeypress,
            mercury.valueEvent(events.updatePublishFormText, { id: form.id }), 
            valueEvents.ctrlEnter(events.submitPublishForm, { id: form.id })
          ],
          'ev-input': events.mentionBoxInput
        })),          
        h('button.btn.btn-default', 'Post'),
        ' ',
        (!form.permanent) ? jsa(['cancel'], events.cancelPublishForm, { id: form.id }, { className: 'cancel' }) : '',
        h('span.pull-right', [
          jsa('text', events.setPublishFormType, { id: form.id, type: 'text' }),
          ' / ',
          h('strong', jsa('action', events.setPublishFormType, { id: form.id, type: 'act' }))
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

function shortHex(str) {
  return str.slice(0, 6) + '...' + str.slice(-2)
}