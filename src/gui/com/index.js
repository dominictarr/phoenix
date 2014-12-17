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
  return h('button.btn.btn-default.beh-sync', 'Sync' + num)
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
exports.header = function(uId, syncMsgsWaiting) {
  return h('.nav.navbar.navbar-default', [
    h('.container', [
      h('.navbar-header', h('a.navbar-brand', { href: '#/' }, 'scuttlebutt')),
      h('ul.nav.navbar-nav', [
        h('li', a('#/network', 'network')),
        h('li', a('#/help', 'help'))
      ]),
      h('ul.nav.navbar-nav.navbar-right', [
        h('li', h('a.beh-show-yourid', {href: '#'}, 'your contact id')),
        h('li', a('#/profile/' + uId, 'profile')),
        h('li', h('button.btn.btn-default.beh-add-contact', 'Add contact')),
        h('li', syncButton(syncMsgsWaiting))
      ])
    ])
  ])
}

var sidenav =
exports.sidenav = function(state) {
  var pages = [
    ['feed', '', 'feed'],
    ['inbox', 'inbox', 'inbox ('+state.unreadMessages+')'],
  ]
  return h('.side-nav', [
    pages.map(function(page) {
      if (page[0] == state.page.id)
        return h('p', h('strong', a('#/'+page[1], page[2])))
      return h('p', a('#/'+page[1], page[2]))
    })
  ])
}

var page =
exports.page = function(state, id, content) {
  return h('div',
    header(state.user.id, 0),
    h('#page.container.'+id+'-page', content)
  )
}

exports.message = require('./message')