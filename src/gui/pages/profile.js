var h = require('hyperscript')
var pull = require('pull-stream')
var com = require('../com')
var util = require('../../lib/util')

module.exports = function(state) {
  var pid = state.page.param
  var profile = state.profiles[pid]
  var isFollowing = (state.user.following.indexOf(pid) != -1)

  // render messages
  var msgfeed, msgs = []
  for (var i=state.msgs.length-1; i>=0; i--) {
    if (state.msgs[i].value.author == pid)
      msgs.push(com.message(state, state.msgs[i]))
  }
  if (msgs.length)
    msgfeed = h('.message-feed', msgs)
  else {
    msgfeed = h('p', 
      'No messages found for this user.',
      ((!isFollowing) ? 
        h('p.text-muted', 'Follow this user to begin searching the network for their data.') :
        h('p.text-muted', 'Scuttlebutt is searching the network for this user.'))
    )
  }

  // render controls
  var followBtn = '', setNameBtn = ''
  if (pid == state.user.id) {
    setNameBtn = h('button.btn.btn-default.click-set-name', 'Set Nickname')
  } else {
    setNameBtn = h('button.btn.btn-default.click-set-name', {'data-user-id': pid}, 'Give Nickname')
    if (isFollowing)
      followBtn = h('button.btn.btn-default.click-unfollow', {'data-user-id': pid}, 'Unfollow')
    else
      followBtn = h('button.btn.btn-default.click-follow', {'data-user-id': pid}, 'Follow')
  } 

  // given names
  var givenNames = []
  if (profile.self.name)
    givenNames.push(h('li', profile.self.name + ' (self-assigned)'))
  Object.keys(profile.given).forEach(function(userid) {
    var given = profile.given[userid]
    if (given.name)
      givenNames.push(h('li', given.name + ' by ', com.userlink(userid, state.names[userid])))
  })
  if (givenNames.length)
    givenNames = [h('small', 'Given Names'), h('br'), h('ul.list-unstyled', givenNames)]

  // render page
  var name = state.names[pid] || util.shortString(pid)
  var joinDate = (profile) ? util.prettydate(new Date(profile.createdAt), true) : '-'
  state.setPage(com.page(state, 'profile', h('.row',
    h('.col-xs-2.col-md-1', com.sidenav(state)),
    h('.col-xs-7.col-md-7', msgfeed),
    h('.col-xs-3.col-md-4',
      h('h2', name, ' ', h('small', 'joined '+joinDate)),
      h('p', followBtn, ' ', setNameBtn),
      h('small', 'EmojID:'), h('br'),
      h('div', { style: { width: '160px', 'margin-bottom': '1em' }, innerHTML: com.toEmoji(pid) }),
      givenNames
    )
  )))
}