var h = require('hyperscript')
var pull = require('pull-stream')
var com = require('../com')
var util = require('../../lib/util')

module.exports = function(state) {
  var pid = state.page.param
  var profile = state.profiles[pid]

  if (!profile) {
    // :TODO: profile not found
    return state.setPage(com.page(state, 'profile', h('.row',
      h('.col-xs-1', com.sidenav(state)),
      h('.col-xs-7', 'Not found (todo)')
    )))
  }

  // render messages
  var msgs = []
  for (var i=state.msgs.length-1; i>=0; i--) {
    if (state.msgs[i].value.author == pid)
      msgs.push(com.message(state, state.msgs[i]))
  }

  // render controls
  var followBtn = '', setNickBtn = ''
  var isFollowing = (state.user.following.indexOf(pid) != -1)
  if (pid == state.user.id) {
    setNickBtn = h('button.btn.btn-default.click-set-nickname', 'Set Nickname')
  } else {
    setNickBtn = h('button.btn.btn-default.click-set-nickname', {'data-user-id': pid}, 'Give Nickname')
    if (isFollowing)
      followBtn = h('button.btn.btn-default.click-unfollow', {'data-user-id': pid}, 'Unfollow')
    else
      followBtn = h('button.btn.btn-default.click-follow', {'data-user-id': pid}, 'Follow')
  } 

  // render page
  var nickname = state.nicknames[pid]
  var joinDate = new Date(profile.createdAt)
  state.setPage(com.page(state, 'profile', h('.row',
    h('.col-xs-1', com.sidenav(state)),
    h('.col-xs-7', h('.message-feed', msgs)),
    h('.col-xs-4',
      h('h2', nickname, ' ', h('small', 'joined '+util.prettydate(joinDate, true))),
      h('p', followBtn, ' ', setNickBtn),
      h('small', 'EmojID:'), h('br'),
      h('div', { style: { width: '160px' }, innerHTML: com.toEmoji(pid) })
    )
  )))
}