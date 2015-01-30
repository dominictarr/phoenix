'use strict'
var h = require('hyperscript')
var baseEmoji = require('base-emoji')
var util = require('../lib/util')

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

var nameConfidence =
exports.nameConfidence = function (id, app) {
  if (app.nameTrustRanks[id] !== 1) {
    return [' ', h('a', 
      { title: 'This name was self-assigned and needs to be confirmed.', href: '#/profile/'+id },
      h('span.text-muted', icon('user'), '?')
    )]
  }
  return ''
}

var userlink =
exports.userlink = function (id, text, opts) {
  opts = opts || {}
  opts.className = (opts.className || '') + ' user-link'
  text = text || util.shortString(id)
  return h('span', a('#/profile/'+id, text, opts))
}

var userlinkThin =
exports.userlinkThin = function (id, text, opts) {
  opts = opts || {}
  opts.className = (opts.className || '') + 'thin'
  return userlink(id, text, opts)
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
    ['posts', '', 'posts'],
    ['inbox', 'inbox', 'inbox ('+app.unreadMessages+')'],
    ['adverts', 'adverts', 'adverts'],
    '-',
    ['feed', 'feed', 'data feed']
  ]
  var extraPages = [
    ['address-book', 'address-book', 'addresses'],
    ['profile', 'profile/'+app.myid, app.names[app.myid] || 'profile'],
    ['help', 'help', 'help']
  ]

  return h('.side-nav', [
    h('p', h('a.btn.btn-primary.btn-strong', { href: '#/compose' }, 'new post')),
    h('hr'),
    pages.map(function (page) {
      if (page == '-')
        return h('hr')
      if (page[0] == app.page.id)
        return h('p.side-nav-'+page[0], h('strong', a('#/'+page[1], page[2])))
      return h('p.side-nav-'+page[0], a('#/'+page[1], page[2]))
    }),
    extraPages.map(function (page) {
      if (page == '-')
        return h('hr')
      if (page[0] == app.page.id)
        return h('p.visible-xs.side-nav-'+page[0], h('strong', a('#/'+page[1], page[2])))
      return h('p.visible-xs.side-nav-'+page[0], a('#/'+page[1], page[2]))
    })
  ])
}

var sidehelp =
exports.sidehelp = function (app, opts) {
  return h('ul.list-unstyled',
    h('li', h('button.btn.btn-primary', { onclick: app.showUserId }, 'Get your id')),
    h('li', h('button.btn.btn-primary', { onclick: app.followPrompt }, 'Add a contact')),
    h('li', h('button.btn.btn-primary', { onclick: app.followPrompt }, 'Use an invite')),
    (!opts || !opts.noMore) ? h('li', h('span', {style:'display: inline-block; padding: 6px 12px'}, a('#/help', 'More help'))) : ''
  )
}

var panel =
exports.panel = function (title, content) {
  return h('.panel.panel-default', [
    (title) ? h('.panel-heading', h('h3.panel-title', title)) : '',
    h('.panel-body', content)
  ])
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