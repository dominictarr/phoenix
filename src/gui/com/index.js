var h = require('hyperscript')

var a =
exports.a = function(href, text, opts) {
  opts = opts || {}
  opts.href = href
  return h('a', opts, text)
}

var syncButton =
exports.syncButton = function(syncMsgsWaiting) {
  var num = ''
  if (syncMsgsWaiting > 0)
    num = ' ('+syncMsgsWaiting+')'
  return h('button.btn.btn-default.beh-sync', 'Sync' + num)
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

var page =
exports.page = function(state, id, content) {
  return h('div',
    header(state.user.id, 0),
    h('#page.container.'+id, h('.row', content))
  )
}