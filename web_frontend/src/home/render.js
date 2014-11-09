var mercury     = require('mercury')
var h           = require('mercury').h
var util        = require('../../../lib/util')
var valueEvents = require('../lib/value-events')
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
        h('li', a('#/inbox', 'inbox')),
        h('li', a('#/profile/' + uId, 'profile')),
        h('li', a('#/network', 'network')),
        h('li', a('#/help', 'help'))
      ]),
      h('ul.nav.navbar-nav.navbar-right', [
        h('li', a('#', 'your contact id', { 'ev-click': valueEvents.click(events.showId, { id: uId }, { preventDefault: true }) })),
        h('li', h('button.btn.btn-default', {'ev-click': events.addFeed}, 'Add contact')),
        h('li', comren.syncButton(events, isSyncing))
      ])
    ])
  ])
}

// Feed Page
// =========

function feedPage(state) {
  return h('.feed-page.row', comren.columns({
    main: [
      mercury.partial(feedFilters, state.events, state.feedView.filters), 
      mercury.partial(com.publishForm, state.feedView.publishForms[0], state.events, state.user, state.nicknameMap), 
      mercury.partial(mainFeed, state.feedView, state.events, state.user, state.nicknameMap)
    ],
    side: [mercury.partial(sideFeed, state.feedView, state.events, state.user, state.nicknameMap)]
  }, [['main', 7], ['side', 5]]))
}

function mainFeed(feedView, events, user, nicknameMap) {
  var msgs = feedView.messages.filter(function(msg) {
    if (msg.hidden) return false
    if (msg.repliesToLink) return false
    if (!feedView.filters.shares    && msg.rebroadcastsLink) return false
    if (!feedView.filters.textPosts && msg.content.postType == 'text') return false
    if (!feedView.filters.guiPosts  && msg.content.postType == 'gui') return false
    return msg.content.postType == 'text' || msg.content.postType == 'gui'
  })
  return comren.feed(msgs, feedView, events, user, nicknameMap, false, true)
}

function sideFeed(feedView, events, user, nicknameMap) {
  var events = feedView.messages.filter(function(msg) {
    if (msg.hidden) return false
    if (msg.content.type == 'profile') return true
    if (msg.content.type == 'follow') return feedView.filters.follows
    if (msg.content.postType == 'action' && !msg.repliesToLink) return feedView.filters.actionPosts
    return false
  })
  return comren.feed(events, feedView, events, user, nicknameMap, false, false)
}

function feedFilters(events, filters) {
  function feedFilter(name, label) {
    return h('label', [
      h('input', {
        type: 'checkbox',
        checked: (filters[name]) ? 'checked' : '',
        'ev-event': mercury.changeEvent(events.toggleFilter, { filter: name, set: !filters[name] })
      }), 
      h('span', label)
    ])
  }

  return h('p.feed-filters.text-muted', [
    'Filters: ',
    feedFilter('shares', 'shared posts'),
    ' ',
    feedFilter('textPosts', 'text posts'),
    ' ',
    feedFilter('actionPosts', 'action posts'),
    ' ',
    feedFilter('guiPosts', 'gui posts'),
    ' ',
    feedFilter('follows', 'follows')
  ])
}


// Inbox Page
// ==========

function inboxPage(state) {
  var msgs = state.notifications.map(function(note) {
    var msgi  = state.feedView.messageMap[note.msgIdStr]
    return (typeof msgi != 'undefined') ? state.feedView.messages[state.feedView.messages.length - msgi - 1] : null
  })
  var events = state.feedView.messages.filter(function(msg) {
    if (msg.content.type == 'follow' && util.toHexString(msg.content.$feed) === state.user.idStr) return true
    return false
  })

  return h('.inbox-page.row', comren.columns({
    main: [comren.feed(msgs, state.feedView, state.events, state.user, state.nicknameMap, true)],
    side: [comren.feed(events, state.feedView, state.events, state.user, state.nicknameMap)],
  }, [['main', 7], ['side', 5]]))
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
  var isYou = (state.user.idStr == profid)
  var followsYou = (state.followerUsers.indexOf(profid) !== -1)
  return h('.profile-page.row', comren.columns({
    main: [comren.feed(profile.feed, state.feedView, state.events, state.user, state.nicknameMap, true)],
    side: [mercury.partial(profileControls, state.events, profile, isYou, followsYou)]
  }, [['main', 7], ['side', 5]]))
}

function profileControls(events, profile, isYou, followsYou) {
  var followBtn = (profile.isFollowing) ?
    h('button.btn.btn-default', {'ev-click': valueEvents.click(events.unfollow,  { id: profile.idStr })}, 'Unfollow') :
    h('button.btn.btn-default', {'ev-click': valueEvents.click(events.follow,  { id: profile.idStr })}, 'Follow')
  return h('.profile-ctrls', [
    h('.panel.panel-default',
      h('.panel-body', [
        h('h2', [profile.nickname, ' ', h('small', 'joined '+profile.joinDate)]),
        (followsYou) ? [h('span.label.label-primary', 'Follows You'), ' '] : ''
      ])
    ),
    (!isYou) ? h('p', followBtn) : '',
    h('div.text-muted', [
      h('p', h('small', [h('strong', 'User\'s Contact ID: '), profile.idStr]))
    ])
  ])
}

// Message Page
// ============

function messagePage(state, msgid) {
  // lookup the main message
  var msgi = state.feedView.messageMap[msgid]
  var msg = (typeof msgi != 'undefined') ? state.feedView.messages[state.feedView.messages.length - msgi - 1] : undefined
  if (!msg) {
    return h('.message-page.row', [
      h('.col-xs-7', [comren.notfound('that message')])
    ])
  }

  // render
  return h('.message-page.row', comren.columns({
    main: comren.msgThread(msg, state.feedView, state.events, state.user, state.nicknameMap, true),
    info: mercury.partial(messageInfo, msg)
  }, [['main', 8], ['info', 4]]))
}

function messageInfo(msg) {
  return h('div.text-muted', [
    h('p', h('small', [h('strong', 'Message ID:'), ' ', msg.idStr])),
    h('p', h('small', [h('strong', 'Author\'s Contact ID:'), ' ', msg.authorStr]))
  ])
}

// Network Page
// ============

function networkPage(state) {
  function getProfile(idStr) {
    return state.profiles[state.profileMap[idStr]] || { id: util.toBuffer(idStr), idStr: idStr }
  }
  var followedProfiles = state.followedUsers.map(getProfile)
  var followerProfiles = state.followerUsers.map(getProfile)

  return h('.network-page.row', comren.columns({
    col1: h('.panel.panel-default', [
      h('.panel-heading', h('h3.panel-title', [
        'Following',
        h('button.btn.btn-default.btn-xs.pull-right', {'ev-click': state.events.addFeed}, 'add')
      ])),
      h('.panel-body', profileLinks(state.events, followedProfiles, true))
    ]),
    col2: h('.panel.panel-default', [
      h('.panel-heading', h('h3.panel-title', 'Followers')),
      h('.panel-body', profileLinks(state.events, followerProfiles, false))
    ]),
    col3: h('.panel.panel-default', [
      h('.panel-heading', h('h3.panel-title', 'Known Users')),
      h('.panel-body', profileLinks(state.events, state.profiles, false))
    ]),
    col4: h('.panel.panel-default', [
      h('.panel-heading', h('h3.panel-title', [
        'Known Servers',
        h('button.btn.btn-default.btn-xs.pull-right', {'ev-click': state.events.addServer}, 'add')
      ])),
      h('.panel-body', serverLinks(state.events, state.servers))
    ]),
  }, [['col1', 3], ['col2', 3], ['col3', 3], ['col4', 3]]))
}

function serverLinks(events, servers) {
  return h('.servers', servers.map(serverLink.bind(null, events)))
}

function serverLink(events, server) {
  return h('h3', [
    a(server.url, server.hostname),
    h('button.btn.btn-default.btn-xs.pull-right', {'ev-click': valueEvents.click(events.removeServer, { hostname: server.hostname, port: server.port })}, 'remove')
  ])
}

function profileLinks(events, profiles, canRemove) {
  return profiles.map(profileLink.bind(null, events, canRemove))
}

function profileLink(events, canRemove, profile) {
  return h('h3', [
    a('/#/profile/'+profile.idStr, profile.nickname || comren.shortHex(profile.idStr)),
    (canRemove)
      ? h('button.btn.btn-default.btn-xs.pull-right', {'ev-click': valueEvents.click(events.unfollow, { id: profile.id })}, 'remove')
      : ''
  ])
}

// Help Page
// =========

function helpPage(state, section) {
  var content
  if (section == 'networking') {
    content = [
      panel('Contacts', ['If you want to follow somebody and receive their broadcasts and messages, you have to add them as a contact. They\'ll have to do the same if they want to see your messages. ', h('strong', 'TODO: how to add contacts')]),
      panel('Pub Servers', 'Phoenix uses "pub servers" to get messages across the network. Pub servers are simplistic: all they do is receive your messages and host them for other people to fetch. Since they\'re on the public web and always on, they help the network stay available.'),
      panel('Sync', 'To get the latest messages, you need to ask the servers in your network for the latest (kind of like with email). This happens periodically in the background, but, if you want to force a sync, you can press the big Sync button in the top right.')
    ]
  } else if (section == 'privacy') {
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
      panel('Emojis', ['You can put emojis in your posts using colons. For instance, \':smile:\' will result in ', h('img.emoji', { src: '/img/emoji/smile.png', height: 20, width: 20}), '. Check the ', comren.a('http://www.emoji-cheat-sheet.com/', 'Emoji Cheat Sheet'), ' to see what\'s available'])
    ]
  }

  return h('.help-page.row', comren.columns({
    content: content,
    sidenav: h('ul.nav.nav-pills.nav-stacked', nav('#/'+state.route, [
      ['#/help', 'Getting Started'],
      ['#/help/networking', 'Networking'],
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
