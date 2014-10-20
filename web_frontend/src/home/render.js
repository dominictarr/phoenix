var mercury     = require('mercury')
var h           = require('mercury').h
var util        = require('../../../lib/util')
var valueEvents = require('../lib/value-events')
var widgets     = require('../lib/widgets')
var comren      = require('../lib/common-render')
var com         = require('../lib/com')
var widgets     = require('../lib/widgets')

module.exports = render

// Layout
// ======

function render(state) {
  var page
  if (state.route == 'network') {
    page = networkPage(state)
  } else if (state.route == 'inbox') {
    page = inboxPage(state)
  } else if (state.route.indexOf('profile/') === 0) {
    var profid = state.route.slice(8)
    page = profilePage(state, profid)
  } else if (state.route.indexOf('msg/') === 0) {
    var msgid = state.route.slice(4)
    page = messagePage(state, msgid)
  } else if (state.route.indexOf('help') === 0) {
    var section = state.route.slice(5) || 'intro'
    page = helpPage(state, section)
  } else {
    page = feedPage(state)
  }

  return h('.homeapp', { 'style': { 'visibility': 'hidden' } }, [
    stylesheet('/css/home.css'),
    mercury.partial(com.suggestBox, state.suggestBox),
    mercury.partial(header, state.events, state.user.idStr, state.isSyncing),
    mercury.partial(comren.connStatus, state.events, state.conn),
    h('.container', page)
  ])
}

function header(events, uId, isSyncing) {
  return h('.nav.navbar.navbar-default', [
    h('.container', [
      h('.navbar-header', h('a.navbar-brand', { href: '#/' }, 'phoenix')),
      h('ul.nav.navbar-nav', [
        h('li', a('#/', 'latest')),
        h('li', a('#/inbox', 'inbox')),
        h('li', a('#/profile/' + uId, 'profile')),
        h('li', a('#/network', 'network')),
        h('li', a('#/help', 'help'))
      ]),
      h('ul.nav.navbar-nav.navbar-right', [
        h('li', a('#', 'your intro token', { 'ev-click': valueEvents.click(events.showIntroToken, { id: uId }, { preventDefault: true }) })),
        h('li', h('button.btn.btn-default', {'ev-click': events.addFeed}, 'Add contact')),
        h('li', comren.syncButton(events, isSyncing))
      ])
    ])
  ])
}

// Feed Page
// =========

function feedPage(state) {
  var events = state.feed.filter(function(msg) { return !(msg.type == 'text' || msg.type == 'gui') && !msg.message.repliesTo })
  var msgs = state.feed.filter(function(msg) { return msg.type == 'text' || msg.type == 'gui' })
  return h('.feed-page.row', comren.columns({
    gutter: '',
    main: [com.publishForm(state.publishForms[0], state.events, state.user, state.nicknameMap), comren.feed(state, msgs, state.pagination)],
    side: [comren.feed(state, events, state.pagination)]
  }, [['main', 7], ['side', 5]]))
}


// Inbox Page
// ==========

function inboxPage(state) {
  return h('.inbox-page.row', comren.columns({
    main: [mercury.partial(notifications, state.nicknameMap, state.events, state.notifications)]
  }, [['main', 12]]))
}

function notifications(nicknameMap, events, notes) {
  return h('.panel.panel-default', h('table.table.table-hover.notifications', h('tbody', notes.map(notification.bind(null, nicknameMap, events)).reverse())))
}

function notification(nicknameMap, events, note) {
  return h('tr', { 'ev-click': valueEvents.click(events.openMsg, { idStr: note.msgIdStr }, { preventDefault: true }) }, [
    h('td', note.authorNickname),
    h('td', new widgets.Markdown(note.msgText, { inline: true, nicknames: nicknameMap })),
    h('td', util.prettydate(new Date(note.timestamp||0), true))
  ])
}


// Profile Page
// ============

function profilePage(state, profid) {
  var profi = state.profileMap[profid]
  var profile = (typeof profi != 'undefined') ? state.profiles[profi] : undefined
  if (!profile) {
    return h('.profile-page.row', [
      h('.col-xs-7', [comren.notfound('that user')])
    ])
  }
  return h('.profile-page.row', comren.columns({
    main: [comren.feed(state, profile.feed, state.pagination, true)],
    side: [mercury.partial(profileControls, state.events, profile)]
  }, [['main', 7], ['side', 5]]))
}

function profileControls(events, profile) {
  var followBtn = (profile.isFollowing) ?
    h('button.btn.btn-default', {'ev-click': valueEvents.click(events.unfollow,  { id: profile.idStr })}, 'Unfollow') :
    h('button.btn.btn-default', {'ev-click': valueEvents.click(events.follow,  { id: profile.idStr })}, 'Follow')
  return h('.profile-ctrls', [
    h('.panel.panel-default', h('.panel-body', h('h2', [profile.nickname, ' ', h('small', 'joined '+profile.joinDate)]))),
    h('p', followBtn),
    h('p', a('#', 'Intro Token', { 'ev-click': valueEvents.click(events.showIntroToken, { id: profile.idStr }, { preventDefault: true }) }))
  ])
}

// Message Page
// ============

function messagePage(state, msgid) {
  // lookup the main message
  var msgi = state.messageMap[msgid]
  var msg = (typeof msgi != 'undefined') ? state.feed[state.feed.length - msgi - 1] : undefined
  if (!msg) {
    return h('.message-page.row', [
      h('.col-xs-7', [comren.notfound('that message')])
    ])
  }

  // render
  return h('.message-page.row', comren.columns({
    main: comren.msgThread(state, msg)
  }, [['main', 8]]))
}

// Network Page
// ============

function networkPage(state) {
  return h('.network-page.row', comren.columns({
    col1: h('.panel.panel-default', [
      h('.panel-heading', h('h3.panel-title', [
        'Following',
        h('button.btn.btn-default.btn-xs.pull-right', {'ev-click': state.events.addFeed}, 'add')
      ])),
      h('.panel-body', profileLinks(state.events, state.profiles.filter(isFollowing)))
    ]),
    col2: h('.panel.panel-default', [
      h('.panel-heading', h('h3.panel-title', 'Followers')),
      h('.panel-body', '')
    ]),
    col3: h('.panel.panel-default', [
      h('.panel-heading', h('h3.panel-title', [
        'Known Servers',
        h('button.btn.btn-default.btn-xs.pull-right', {'ev-click': state.events.addServer}, 'add')
      ])),
      h('.panel-body', serverLinks(state.events, state.servers))
    ])
  }, [['col1', 3], ['col2', 3], ['col3', 3]]))
}

function isFollowing(p) { return p.isFollowing }

function serverLinks(events, servers) {
  return h('.servers', servers.map(serverLink.bind(null, events)))
}

function serverLink(events, server) {
  return h('h3', [
    a(server.url, server.hostname),
    h('button.btn.btn-default.btn-xs.pull-right', {'ev-click': valueEvents.click(events.removeServer, { hostname: server.hostname, port: server.port })}, 'remove')
  ])
}

function profileLinks(events, profiles) {
  return profiles.map(profileLink.bind(null, events))
}

function profileLink(events, profile) {
  return h('h3', [
    a('/#/profile/'+profile.idStr, profile.nickname || '???'),
    h('button.btn.btn-default.btn-xs.pull-right', {'ev-click': valueEvents.click(events.unfollow, { id: profile.id })}, 'remove')
  ])
}

// Help Page
// =========

function helpPage(state, section) {
  var content
  if (section == 'privacy') {
    content = [
      panel('How Phoenix Works', 'Phoenix is built on a "distributed" messaging system, like email. Users and their messages are identified by unique, secure keys, allowing us to share messages between devices without relying on central servers.'),
      panel('Is it Private?', 'Phoenix v1 is only a public broadcast system, like Twitter. In future versions, we\'ll add encryption and direct messages so that you can share messages with individuals and groups.')
    ]
  } else {
    content = [
      panel('Basics', 'Phoenix v1 is a social feed application. You can broadcast to everyone following you, much like on Twitter. However, unlike Twitter, only people you are following can contact you. This means no unsolicited spam!'),
      panel('Replies', 'You can reply to other users with text posts, reactions, and guis. When you open a message\'s page, you\'ll see all of the replies in a threaded view, like a message-board. Click the age of a post (eg "5m", "yesterday") to get to its page.'),
      panel('Sharing', 'If you want to spread somebody\'s message, you can "share" it to your followers. This is just like retweeting, except, in the case of Phoenix, it\'s the ONLY way to spread a message. If somebody replies to you, your non-mutual followers will only see that reply if you share it.'),
      panel('Mentions', ['Like in most social networks, you can "@-mention" other users. If they follow you, or if somebody shares the message to them, they\'ll be notified of the mention. Check your ', comren.a('#/inbox', 'Inbox'), ' to find your notifications.']),
      panel('Emojis', ['You can put emojis in your posts using colons. For instance, \':smile:\' will result in ', h('img.emoji', { src: '/img/emoji/smile.png', height: 20, width: 20}), '. Check the ', comren.a('http://www.emoji-cheat-sheet.com/', 'Emoji Cheat Sheet'), ' to see what\'s available']),
      panel('Contacts', ['If you want to follow somebody and receive their broadcasts and messages, you have to add them as a contact. They\'ll have to do the same if they want to see your messages. ', h('strong', 'TODO: how to add contacts')])
    ]
  }

  return h('.help-page.row', comren.columns({
    content: content,
    sidenav: h('ul.nav.nav-pills.nav-stacked', nav('#/'+state.route, [
      ['#/help', 'Getting Started'],
      ['#/help/privacy', 'Privacy']
    ]))
  }, [['content', 7], ['sidenav', 3]]))
}

// Helpers
// =======

function nav(current, items) {
  return items.map(function(item) {
    if (item[0] == current)
      return h('li.active', comren.a(item[0], item[1]))
    return h('li', comren.a(item[0], item[1]))
  })
}

function panel(title, content) {
  return h('.panel.panel-default', [
    h('.panel-heading', h('h3.panel-title', title)),
    h('.panel-body', content)
  ])
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