var mercury = require('mercury')
var h = require('mercury').h
var util = require('../../../lib/util')
var valueEvents = require('./lib/value-events')

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
  } else {
    page = feedPage(state)
  }

  return h('.homeapp.container', { 'style': { 'visibility': 'hidden' } }, [
    stylesheet('/css/home.css'),
    mercury.partial(header, state.events, state.user.idStr),
    page
  ])
}

// Common Components
// =================

function header(events, uId) {
  var sep = function() { return h('small', ' / ') }
  return h('.nav-header', [
    h('strong', 'phoenix'),
    sep(), a('#/', 'latest'),
    sep(), a('#/profile/' + uId, 'profile'),
    sep(), a('#/network', 'network'),
    a('#', 'your intro token', { className: 'pull-right', 'ev-click': valueEvents.click(events.showIntroToken, { id: uId }) })
  ])
}

function notfound(what, suggestion) {
  return h('div', [
    h('h3', 'Sorry, '+what+' was not found.' + (suggestion || '')),
    h('p', h('small', 'here\'s a cuddly kitty to help you through this trying time')),
    randomcat()
  ])
}

var cats = ['goingdown', 'hophop', 'huuhuuu', 'pillow-spin', 'shred', 'tailbites', 'woahwoah']
function randomcat() {
  var cat = cats[Math.round(Math.random() * 7)] || cats[0]
  return img('/img/loading/'+cat+'.gif')
}

function mascot(quote) {
  return h('.class', [
    img('/img/logo.png'),
    h('strong', [h('small', quote)])
  ])
}

function feed(feed, rev) {
  var messages = feed.map(message)
  if (rev) messages.reverse()
  return h('table.feed', messages)
}

function message(msg) {
  var content;
  switch (msg.type.toString()) {
    case 'init': content = h('strong', h('small', 'Account created')); break
    case 'text': content = util.escapePlain(msg.message.plain); break
    case 'profile': content = h('strong', h('small', 'Is now known as ' + util.escapePlain(msg.message.nickname))); break
    default: content = h('em', 'Unknown message type: ' + util.escapePlain(msg.type.toString())); break
  }

  return h('tr', [
    h('td.content', [
      h('p', [h('strong', util.escapePlain(msg.authorNickname)), h('small', util.prettydate(new Date(msg.timestamp)))]),
      h('p', content)
    ])
  ])
}

// Feed Page
// =========

function feedPage(state) {
  return h('.feed-page.row', [
    h('.col-xs-8', [feed(state.feed), mercury.partial(mascot, 'Dont let life get you down!')]),
    h('.col-xs-4', [feedControls(state.events, state.publishForm, state.lastSync), mercury.partial(profileLinks, state.profiles)])
  ])
}

function feedControls(events, publishForm, lastSync) {
  return h('.feed-ctrls', [
    h('div.feed-publish', { 'ev-event': valueEvents.submit(events.submitPublishForm) }, [
      h('div', h('textarea.form-control', {
        name: 'publishText',
        placeholder: 'Publish...',
        rows: publishForm.textFieldRows,
        value: publishForm.textFieldValue,
        'ev-change': mercury.valueEvent(events.setPublishFormTextField),
        'ev-keyup': mercury.valueEvent(events.updatePublishFormTextField)
      })),
      h('button.btn.btn-default', 'Post')
    ]),
    h('p', 'Last synced '+lastSync),
    h('p', [
      h('button.btn.btn-default', 'Sync'),
      h('button.btn.btn-default', {'ev-click': events.addFeed}, 'Add feed...')
    ])
  ])
}

function profileLinks(profiles) {
  return h('div', profiles.map(profileLink))
}

function profileLink(profile) {
  return h('div', a('/#/profile/'+profile.idStr, profile.nickname || '???'))
}

// Profile Page
// ============

function profilePage(state, profid) {
  var profi = state.profileMap[profid]
  var profile = (typeof profi != 'undefined') ? state.profiles[profi] : undefined
  if (!profile) {
    return h('.profile-page.row', [
      h('.col-xs-8', [notfound('that user')])
    ])
  }
  return h('.profile-page.row', [
    h('.col-xs-8', [feed(profile.feed, true), mercury.partial(mascot, 'Is it hot in here?')]),
    h('.col-xs-4', [mercury.partial(profileControls, state.events, profile)])
  ])
}

function profileControls(events, profile) {
  var followBtn = (profile.isFollowing) ?
    h('button.btn.btn-default', {'ev-click': valueEvents.click(events.unfollow,  { id: profile.idStr })}, 'Unfollow') :
    h('button.btn.btn-default', {'ev-click': valueEvents.click(events.follow,  { id: profile.idStr })}, 'Follow')
  return h('.profile-ctrls', [
    h('h2', profile.nickname),
    h('h3', h('small', 'joined '+profile.joinDate)),
    h('p', followBtn),
    h('p', a('#', 'Intro Token', { 'ev-click': valueEvents.click(events.showIntroToken, { id: profile.idStr }) }))
  ])
}

// Network Page
// ============

function networkPage(state) {
  return h('.network-page.row', [
    h('.col-xs-8', [pubservers(state.servers), mercury.partial(mascot, 'Who\'s cooking chicken?')]),
    h('.col-xs-4', [mercury.partial(networkControls, state.lastSync)])
  ])
}

function pubservers(servers) {
  return h('table.servers', servers.map(server))
}

function server(server) {
  return h('tr', [
    h('td.content', [
      h('h3', a(server.url, server.hostname)),
      h('p', h('button.btn.btn-default', 'Remove'))
    ])
  ])
}

function networkControls(lastSync) {
  return h('.network-ctrls', [
    h('p', 'Last synced '+lastSync),
    h('p', [h('button.btn.btn-default', 'Sync'), h('button.btn.btn-default', 'Add host...')])
  ])
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