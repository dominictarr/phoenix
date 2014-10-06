var mercury     = require('mercury')
var h           = require('mercury').h
var util        = require('../../../lib/util')
var valueEvents = require('../lib/value-events')
var widgets     = require('../lib/widgets')
var comren      = require('../lib/common-render')

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
        h('li', a('#/', 'members'))
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

// Members Page
// ============

function membersPage(state) {
  return h('.members-page.row', [
    h('.col-xs-7', [members(state.profiles), mercury.partial(comren.mascot, 'Welcome to the phoenix network!')])
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
      h('.col-xs-7', [comren.notfound('that user')])
    ])
  }
  return h('.profile-page.row', comren.columns({
    main: [comren.feed(state, profile.feed, true), mercury.partial(comren.mascot, 'Is it hot in here?')],
    side: [mercury.partial(profileControls, state.events, profile)]
  }, state.layout))
}

function profileControls(events, profile) {
  return h('.profile-ctrls', [
    h('h2', [profile.nickname, ' ', h('small', 'joined '+profile.joinDate)]),
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