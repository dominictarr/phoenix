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
  } else if (state.route.indexOf('profile/') === 0) {
    var profid = state.route.slice(8)
    page = profilePage(state, profid)
  } else if (state.route.indexOf('msg/') === 0) {
    var msgid = state.route.slice(4)
    page = messagePage(state, msgid)
  } else {
    page = feedPage(state)
  }

  return h('.homeapp', { 'style': { 'visibility': 'hidden' } }, [
    stylesheet('/css/home.css'),
    mercury.partial(com.suggestBox, state.suggestBox),
    mercury.partial(header, state.events, state.user.idStr),
    mercury.partial(comren.connStatus, state.events, state.conn),
    h('.container-fluid', page)
  ])
}

function header(events, uId) {
  return h('.nav.navbar.navbar-default', [
    h('.container-fluid', [
      h('.navbar-header', h('a.navbar-brand', { href: '#/' }, 'phoenix')),
      h('ul.nav.navbar-nav', [
        h('li', a('#/', 'latest')),
        h('li', a('#/profile/' + uId, 'profile')),
        h('li', a('#/network', 'network'))
      ]),
      h('ul.nav.navbar-nav.navbar-right', [
        h('li', a('#', 'your intro token', { 'ev-click': valueEvents.click(events.showIntroToken, { id: uId }, { preventDefault: true }) }))
      ])
    ])
  ])
}

// Feed Page
// =========

function feedPage(state) {
  var events = state.feed.filter(function(msg) { return msg.type != 'text' })
  var texts = state.feed.filter(function(msg) { return msg.type == 'text' })
  return h('.feed-page.row', comren.columns({
    left: [comren.feed(state, events, state.pagination)],
    main: [comren.publishForm(state.publishForms[0], state.events, state.user, state.nicknameMap), comren.feed(state, texts, state.pagination)],
    right: [feedControls(state), mercury.partial(notifications, state.nicknameMap, state.events, state.notifications)]
  }, [['left', 3], ['main', 5], ['right', 4]]))
}

function feedControls(state) {
  var events = state.events
  var lastSync = state.lastSync
  return h('.feed-ctrls', [
    h('p', 'Last synced '+((lastSync) ? util.prettydate(lastSync, true) : '---')),
    h('p', [
      comren.syncButton(events, state.isSyncing),
      ' ',
      h('button.btn.btn-default', {'ev-click': events.addFeed}, 'Add feed...')
    ])
  ])
}

function notifications(nicknameMap, events, notes) {
  return h('table.table.table-hover.notifications', h('tbody', notes.map(notification.bind(null, nicknameMap, events)).reverse()))
}

function notification(nicknameMap, events, note) {
  return h('tr', { 'ev-click': valueEvents.click(events.openMsg, { idStr: note.msgIdStr }, { preventDefault: true }) }, [
    h('td', note.authorNickname),
    h('td', new widgets.Markdown(note.msgText, { inline: true, nicknames: nicknameMap }))
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
  }, state.layout))
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

  // lookup the selected message
  var selectedMsg = msg // :TODO:

  // collect reactions of the selected msg
  var reactions = []
  ;(state.feedReplies[selectedMsg.idStr] || []).forEach(function(replyData) {
    var msgi     = state.messageMap[replyData.idStr] // look up index
    var reaction = (typeof msgi != 'undefined') ? state.feed[state.feed.length - msgi - 1] : null
    if (reaction && reaction.type == 'act')
      reactions.push(reaction)
  })

  // collect rebroadcast data
  var shares = []
  ;(state.feedRebroadcasts[msg.idStr] || []).map(function(share) {
    var msgi  = state.messageMap[share.idStr]
    var share = (typeof msgi != 'undefined') ? state.feed[state.feed.length - msgi - 1] : null    
    if (share)
      shares.push(share)
  })

  // render
  return h('.message-page.row', comren.columns({
    main: comren.msgThread(state, msg),
    side: [
      shares.map(function(shareMsg) {
        return h('span', [
          'Shared by ',
          comren.userlink(shareMsg.author, util.escapePlain(shareMsg.authorNickname)),
          ' ',
          util.prettydate(new Date(shareMsg.timestamp), true),
          h('br')
        ])
      }),
      comren.feed(state, reactions, true)
    ]
  }, state.layout))
}

// Network Page
// ============

function networkPage(state) {
  return h('.network-page.row', comren.columns({
    main: [
      h('h3', 'Pub Servers'),
      mercury.partial(networkControls, state.events, state.lastSync, state.isSyncing),
      pubservers(state.events, state.servers)
    ],
    side: [mercury.partial(profileLinks, state.profiles)]
  }, state.layout))
}

function pubservers(events, servers) {
  return h('.servers', servers.map(server.bind(null, events)))
}

function server(events, server) {
  return h('.panel.panel-default', [
    h('.panel-body', [
      h('h3', a(server.url, server.hostname)),
      h('p', h('button.btn.btn-default', {'ev-click': valueEvents.click(events.removeServer, { hostname: server.hostname, port: server.port })}, 'Remove'))
    ])
  ])
}

function networkControls(events, lastSync, isSyncing) {
  return h('.network-ctrls', [
    h('p', 'Last synced '+((lastSync) ? util.prettydate(lastSync, true) : '---')),
    h('p', [comren.syncButton(events, isSyncing), ' ', h('button.btn.btn-default', {'ev-click': events.addServer}, 'Add server...')])
  ])
}

function profileLinks(profiles) {
  return h('div', [h('h3', 'Feeds'), profiles.map(profileLink)])
}

function profileLink(profile) {
  return h('div', a('/#/profile/'+profile.idStr, profile.nickname || '???'))
}

// Helpers
// =======

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