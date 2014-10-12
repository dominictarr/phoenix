var mercury     = require('mercury')
var h           = require('mercury').h
var util        = require('../../../lib/util')
var valueEvents = require('../lib/value-events')
var widgets     = require('../lib/widgets')
var comren      = require('../lib/common-render')
var com         = require('../lib/com')

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
    h('.container', page),
    mercury.partial(footer, state.events)
  ])
}

function header(events, uId) {
  return h('.nav.navbar.navbar-default', [
    h('.container', [
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

function footer(events) {
  return h('.container', [
    h('br'), h('br'),
    h('p', a('#', 'toggle layout', { 'ev-click': valueEvents.click(events.toggleLayout, null, { preventDefault: true }) }))
  ])
}

// Feed Page
// =========

function feedPage(state) {
  return h('.feed-page.row', comren.columns({
    main: [comren.feed(state, state.feed), mercury.partial(comren.mascot, 'Dont let life get you down!')],
    side: [feedControls(state), mercury.partial(notifications, state.notifications)]
  }, state.layout))
}

function feedControls(state) {
  var events = state.events
  var lastSync = state.lastSync
  return h('.feed-ctrls', [
    comren.publishForm(state.publishForms[0], events, state.user, state.nicknameMap),
    h('p', 'Last synced '+((lastSync) ? util.prettydate(lastSync, true) : '---')),
    h('p', [
      comren.syncButton(events, state.isSyncing),
      ' ',
      h('button.btn.btn-default', {'ev-click': events.addFeed}, 'Add feed...')
    ])
  ])
}

function notifications(nots) {
  return h('strong', 'todo')
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
    main: [comren.feed(state, profile.feed, true), mercury.partial(comren.mascot, 'Is it hot in here?')],
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
  var msgi = state.messageMap[msgid]
  var msg = (typeof msgi != 'undefined') ? state.feed[state.feed.length - msgi - 1] : undefined
  if (!msg) {
    return h('.message-page.row', [
      h('.col-xs-7', [comren.notfound('that message')])
    ])
  }

  // build replies feed
  var replies = (state.feedReplies[msg.idStr] || []).map(function(reply) {
    var msgi = state.messageMap[reply.idStr]
    return (typeof msgi != 'undefined') ? state.feed[state.feed.length - msgi - 1] : undefined
  })

  // fetch rebroadcast data
  var dups = (state.feedRebroadcasts[msg.idStr] || []).map(function(dup) {
    var msgi = state.messageMap[dup.idStr]
    var msg = (typeof msgi != 'undefined') ? state.feed[state.feed.length - msgi - 1] : undefined    
    if (!msg) return
    return h('span', [
      'Shared by ',
      comren.userlink(msg.author, util.escapePlain(msg.authorNickname)),
      ' ',
      util.prettydate(new Date(msg.timestamp), true),
      h('br')
    ])
  })

  // render
  return h('.message-page.row', comren.columns({
    main: [h('.feed.nobar', [
      comren.message(state, msg),
      comren.subfeed(state, replies, true)
    ])],
    side: dups
  }, state.layout))
}

// Network Page
// ============

function networkPage(state) {
  return h('.network-page.row', comren.columns({
    main: [
      h('h3', 'Pub Servers'),
      mercury.partial(networkControls, state.events, state.lastSync, state.isSyncing),
      pubservers(state.events, state.servers),
      mercury.partial(comren.mascot, 'Who\'s cooking chicken?')
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