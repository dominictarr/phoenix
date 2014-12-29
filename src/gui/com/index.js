var h = require('hyperscript')
var baseEmoji   = require('base-emoji')

var a =
exports.a = function(href, text, opts) {
  opts = opts || {}
  opts.href = href
  return h('a', opts, text)
}

var icon =
exports.icon = function (i) {
  return h('span.glyphicon.glyphicon-'+i)
}

var syncButton =
exports.syncButton = function(syncMsgsWaiting) {
  var num = ''
  if (syncMsgsWaiting > 0)
    num = ' ('+syncMsgsWaiting+')'
  return h('button.btn.btn-default.sync-btn.click-sync', 'Sync' + num)
}

var userlink =
exports.userlink = function(id, text, opts) {
  opts = opts || {}
  opts.className = (opts.className || '') + ' user-link'
  var profileLink = a('#/profile/'+id, text, opts)
  var followLink = ''//followlink(id, user, events) :TODO:

  return h('span', [profileLink, ' ', followLink])
}

var toEmoji =
exports.toEmoji = function (buf, size) {
  size = size || 20
  if (!buf)
    return ''
  if (typeof buf == 'string')
    buf = new Buffer(buf.slice(0, buf.indexOf('.')), 'base64')
  return baseEmoji.toCustom(buf, function(v, emoji) {
    return '<img class="emoji" width="'+size+'" height="'+size+'" src="/img/emoji/'+emoji.name+'.png" alt=":'+emoji.name+':" title="'+((+v).toString(16))+'">'
  })
}


var header =
exports.header = function(state) {
  return h('.nav.navbar.navbar-default.navbar-fixed-top', [
    h('.container', [
      h('.navbar-header', h('a.navbar-brand', { href: '#/' }, 'scuttlebutt')),
      h('ul.nav.navbar-nav', [
        h('li.hidden-xs', a('#/network', 'network')),
        h('li.hidden-xs', a('#/help', 'help'))
      ]),
      h('ul.nav.navbar-nav.navbar-right', [
        h('li', h('a.click-view-userid', {href: '#'}, 'your contact id')),
        h('li.hidden-xs', a('#/profile/' + state.user.id, 'profile')),
        h('li', h('button.btn.btn-default.click-add-contact', 'Add contact')),
        h('li', syncButton(state.pendingMessages)),
        h('li#header-menu.dropdown',
          h('button.btn.btn-default.click-header-menu', h('span.caret')),
          h('ul.dropdown-menu',
            h('li.dropdown-header', 'Render Mode'),
            headerMenuRendermode(state, 'markdown', 'Markdown'),
            headerMenuRendermode(state, 'rawcontent', 'Raw Content'),
            headerMenuRendermode(state, 'rawfull', 'Raw Full'),
            h('li.divider'),
            h('li.dropdown-header', 'Feed Mode'),
            headerMenuFeedmode(state, 'threaded', 'Threaded'),
            headerMenuFeedmode(state, 'flat', 'Flat')
          )
        )
      ])
    ])
  ])
}
function headerMenuRendermode(state, id, label) {
  if (state.page.renderMode == id)
    label = [icon('ok'), ' ', label]
  return h('li', h('a.click-set-render-mode', { href: '#', 'data-mode': id }, label))
}
function headerMenuFeedmode(state, id, label) {
  if (state.page.feedMode == id)
    label = [icon('ok'), ' ', label]
  return h('li', h('a.click-set-feed-mode', { href: '#', 'data-mode': id }, label))
}

var sidenav =
exports.sidenav = function(state) {
  var pages = [
    ['feed', '', 'feed'],
    ['inbox', 'inbox', 'inbox ('+state.unreadMessages+')']
  ]
  var extraPages = [
    ['profile', 'profile/'+state.user.id, 'profile'],
    ['network', 'network', 'network'],
    ['help', 'help', 'help']
  ]

  return h('.side-nav', [
    pages.map(function(page) {
      if (page[0] == state.page.id)
        return h('p', h('strong', a('#/'+page[1], page[2])))
      return h('p', a('#/'+page[1], page[2]))
    }),
    extraPages.map(function(page) {
      if (page[0] == state.page.id)
        return h('p.visible-xs', h('strong', a('#/'+page[1], page[2])))
      return h('p.visible-xs', a('#/'+page[1], page[2]))
    })
  ])
}

var page =
exports.page = function(state, id, content) {
  return h('div',
    header(state),
    h('#page.container.'+id+'-page', content)
  )
}

exports.message = require('./message')
exports.messageThread = require('./message-thread')
exports.postForm = require('./post-form')