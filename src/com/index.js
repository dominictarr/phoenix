var h = require('hyperscript')
var baseEmoji   = require('base-emoji')

var a =
exports.a = function (href, text, opts) {
  opts = opts || {}
  opts.href = href
  return h('a', opts, text)
}

var icon =
exports.icon = function (i) {
  return h('span.glyphicon.glyphicon-'+i)
}

var userlink =
exports.userlink = function (id, text, opts) {
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
    return '<img class="emoji" width="'+size+'" height="'+size+'" src="/img/emoji/'+emoji.name+'.png" alt=":'+emoji.name+':" title="'+emoji.name+'"> '+emoji.name.replace(/_/g, ' ')+'<br>'
  })
}


var header =
exports.header = function (app) {
  return h('.nav.navbar.navbar-default', [
    h('.container-fluid', [
      h('.navbar-header', h('a.navbar-brand', { href: '#/' }, 'secure scuttlebutt')),
      h('ul.nav.navbar-nav', [
        h('li.hidden-xs', a('#/address-book', 'address book')),
        h('li.hidden-xs', a('#/profile/' + app.myid, app.names[app.myid]))
      ]),
      h('ul.nav.navbar-nav.navbar-right', [
        h('li.hidden-xs', a('#/help', 'help'))
      ])
    ])
  ])
}

var sidenav =
exports.sidenav = function (app) {
  var pages = [
    ['compose', 'compose', 'compose'],
    '-',
    ['posts', '', 'posts'],
    ['inbox', 'inbox', 'inbox ('+app.unreadMessages+')'],
    ['adverts', 'adverts', 'adverts'],
    '-',
    ['feed', 'feed', 'data feed']
  ]
  var extraPages = [
    ['profile', 'profile/'+app.myid, 'profile'],
    ['network', 'network', 'network'],
    ['help', 'help', 'help']
  ]

  return h('.side-nav', [
    pages.map(function (page) {
      if (page == '-')
        return h('hr')
      if (page[0] == app.page.id)
        return h('p', h('strong', a('#/'+page[1], page[2])))
      return h('p', a('#/'+page[1], page[2]))
    }),
    extraPages.map(function (page) {
      if (page == '-')
        return h('hr')
      if (page[0] == app.page.id)
        return h('p.visible-xs', h('strong', a('#/'+page[1], page[2])))
      return h('p.visible-xs', a('#/'+page[1], page[2]))
    })
  ])
}

var sidehelp =
exports.sidehelp = function (app, opts) {
  return h('ul.list-unstyled',
    h('li', h('button.btn.btn-primary', { onclick: app.showUserId }, 'Get your contact id')),
    h('li', h('button.btn.btn-primary', { onclick: app.followPrompt }, 'Add a contact')),
    h('li', h('button.btn.btn-primary', { onclick: app.followPrompt }, 'Use an invite')),
    (!opts || !opts.noMore) ? h('li', h('span', {style:'display: inline-block; padding: 6px 12px'}, a('#/help', 'More help'))) : ''
  )
}

var page =
exports.page = function (app, id, content) {
  return h('div',
    header(app),
    h('#page.container-fluid.'+id+'-page', content)
  )
}

exports.addresses = require('./addresses')
exports.advertForm = require('./advert-form')
exports.adverts = require('./adverts')
exports.message = require('./message')
exports.messageThread = require('./message-thread')
exports.messageSummary = require('./message-summary')
exports.peers = require('./peers')
exports.postForm = require('./post-form')