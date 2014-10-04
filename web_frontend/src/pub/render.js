var mercury     = require('mercury')
var h           = require('mercury').h
var util        = require('../../../lib/util')
var valueEvents = require('../lib/value-events')
var widgets     = require('../lib/widgets')

module.exports = render

// Layout
// ======

function render(state) {
  var page
  if (state.route.indexOf('profile/') === 0) {
    var profid = state.route.slice(8)
    page = profilePage(state, profid)
  } else {
    page = membersPage(state)
  }

  return h('.pubapp', { 'style': { 'visibility': 'hidden' } }, [
    stylesheet('/css/pub.css'),
    mercury.partial(header),
    h('.container', page)
  ])
}

// Common Components
// =================

function header(events, uId) {
  return h('.nav.navbar.navbar-default', [
    h('.container', [
      h('.navbar-header', h('a.navbar-brand', { href: '#/' }, 'phoenix')),
      h('ul.nav.navbar-nav', [
        h('li', a('#/', 'members'))
      ])
    ])
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
  return h('.feed', messages)
}

function message(msg) {
  var content;
  switch (msg.type.toString()) {
    case 'init': content = h('strong', h('small', 'Account created')); break
    case 'text': content = new widgets.Markdown(util.escapePlain(msg.message.plain)); break
    case 'profile': content = h('strong', h('small', 'Is now known as ' + util.escapePlain(msg.message.nickname))); break
    default: content = h('em', 'Unknown message type: ' + util.escapePlain(msg.type.toString())); break
  }

  return h('.panel.panel-default', [
    h('.panel-heading', [h('strong', util.escapePlain(msg.authorNickname)), h('small', ' - ' + util.prettydate(new Date(msg.timestamp), true))]),
    h('.panel-body', content)
  ])
}

// Members Page
// ============

function membersPage(state) {
  return h('.members-page.row', [
    h('.col-xs-7', [members(state.profiles), mercury.partial(mascot, 'Welcome to the phoenix network!')])
  ])
}

function members(profiles) {
  return h('div', profiles.map(member))
}

function member(profile) {
  return h('h3', a('/#/profile/'+profile.idStr, profile.nickname || '???'))
}

// Profile Page
// ============

function profilePage(state, profid) {
  var profi = state.profileMap[profid]
  var profile = (typeof profi != 'undefined') ? state.profiles[profi] : undefined
  if (!profile) {
    return h('.profile-page.row', [
      h('.col-xs-7', [notfound('that user')])
    ])
  }
  return h('.profile-page.row', [
    h('.col-xs-7', [feed(profile.feed, true), mercury.partial(mascot, 'Is it hot in here?')]),
    h('.col-xs-5', [mercury.partial(profileControls, state.events, profile)])
  ])
}

function profileControls(events, profile) {
  return h('.profile-ctrls', [
    h('h2', profile.nickname),
    h('h3', h('small', 'joined '+profile.joinDate)),
    h('p', a('#', 'Intro Token', { 'ev-click': valueEvents.click(events.showIntroToken, { id: profile.idStr }, { preventDefault: true }) }))
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