var h = require('hyperscript')
var pull = require('pull-stream')
var com = require('../com')
var util = require('../../lib/util')

module.exports = function(state) {
  var pid = state.page.param
  var profile = state.profiles[pid]
  var isFollowing = (state.user.following.indexOf(pid) != -1)

  // render messages
  var msgfeed, msgs = [], hasMsgs = false
  for (var i=state.msgs.length-1; i>=0; i--) {
    if (state.msgs[i].value.author == pid) {
      hasMsgs = true
      var m = com.message(state, state.msgs[i])
      if (m) msgs.push(m)
    }
  }
  if (hasMsgs) {
    if (msgs.length)
      msgfeed = h('.message-feed', msgs)
    else
      msgfeed = h('p', h('strong', 'No posts have been published by this user yet.'))
  } else {
    msgfeed = h('p', 
      'No messages found for this user.',
      ((!isFollowing) ? 
        h('p.text-muted', 'Follow this user to begin searching the network for their data.') :
        h('p.text-muted', 'Scuttlebutt is searching the network for this user.'))
    )
  }

  // render controls
  var followBtn = '', trustBtn = '', renameBtn = ''
  if (pid == state.user.id) {
    renameBtn = h('button.btn.btn-primary.click-set-name', {title: 'Rename'}, com.icon('pencil'))
  } else {
    renameBtn = h('button.btn.btn-primary.click-set-name', {'data-user-id': pid, title: 'Rename'}, com.icon('pencil'))
    followBtn = (isFollowing)
      ? h('button.btn.btn-primary.click-unfollow', {'data-user-id': pid}, 'Unfollow')
      : h('button.btn.btn-primary.click-follow', {'data-user-id': pid}, 'Follow')
    trustBtn = (isFollowing)
      ? h('button.btn.btn-primary.click-unfollow', {'data-user-id': pid}, 'Untrust')
      : h('button.btn.btn-primary.click-follow', {'data-user-id': pid}, 'Trust')
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
    givenNames = [h('small.text-muted', 'Given Names ', com.a('#/help/names', '?')), h('br'), h('ul.list-unstyled', givenNames)]

  // render page
  var name = state.names[pid] || util.shortString(pid)
  var joinDate = (profile) ? util.prettydate(new Date(profile.createdAt), true) : '-'
  state.setPage(com.page(state, 'profile', h('.row',
    h('.col-xs-2.col-md-1', com.sidenav(state)),
    h('.col-xs-7.col-md-7', msgfeed),
    h('.col-xs-3.col-md-4',
      h('h2', name, ' ', renameBtn),
      h('p.text-muted', 'joined '+joinDate),
      h('p', followBtn, trustBtn),
      givenNames,
      h('small.text-muted', 'Emoji Fingerprint ', com.a('#/help/fingerprint', '?')),
      h('div', { innerHTML: com.toEmoji(pid) })
    )
  )))
}