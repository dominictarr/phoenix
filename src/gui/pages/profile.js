var h = require('hyperscript')
var pull = require('pull-stream')
var com = require('../com')
var util = require('../../lib/util')

module.exports = function(state) {
  var pid = state.page.param
  var profile = state.profiles[pid]

  if (!profile) {
    // :TODO:
    var page = com.page(state, 'profile', h('.row',
      h('.col-xs-1', com.sidenav(state)),
      h('.col-xs-7', 'Not found (todo)')
    ))

    document.body.innerHTML = ''
    document.body.appendChild(page)
    return
  }

  // render messages
  var msgs = []
  for (var i=state.msgs.length-1; i>=0; i--) {
    if (state.msgs[i].value.author == pid)
      msgs.push(com.message(state, state.msgs[i]))
  }

  console.log(profile)
  var nickname = profile.nickname || util.shortString(pid)
  var joinDate = new Date(profile.createdAt)
  var page = com.page(state, 'profile', h('.row',
    h('.col-xs-1', com.sidenav(state)),
    h('.col-xs-7', h('.message-feed', msgs)),
    h('.col-xs-4',
      h('h2', nickname, ' ', h('small', 'joined '+util.prettydate(joinDate, true))),
      h('small', 'EmojID:'), h('br'),
      h('div', { style: { width: '160px' }, innerHTML: com.toEmoji(pid) })
    )
  ))

  document.body.innerHTML = ''
  document.body.appendChild(page)
}