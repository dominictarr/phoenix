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
var cats = ['goingdown', 'hophop', 'huuhuuu', 'pillow-spin', 'shred', 'tailbites', 'woahwoah', 'cat-v-cat-v-cat']
var randomcat = exports.randomcat = function() {
  var cat = cats[Math.round(Math.random() * 8)] || cats[0]
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
  feed = feed.map(com.message.bind(null, state))
  if (moreBtn)
    feed.push(moreBtn)
  return h('.feed', feed)
}

// message thread view
// - `state`: full application state
// - `msg`: which message's thread to render
var msgThread = exports.msgThread = function(state, msg) {
  return h('.feed', [
    com.message(state, msg),
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
    if (reply && (reply.content.type == 'post' && (reply.content.postType == 'text' || reply.content.postType == 'gui')) && notHidden(reply)) {
      replies.push(com.message(state, reply))

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