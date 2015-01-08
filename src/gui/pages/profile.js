var h = require('hyperscript')
var pull = require('pull-stream')
var com = require('../com')
var util = require('../../lib/util')

module.exports = function(state) {
  var pid = state.page.param
  var profile = state.profiles[pid]
  var isFollowing = state.hasEdge('follow', state.user.id, pid)

  // render messages
  var msgfeed, msgs = [], hasMsgs = false
  for (var i=state.msgs.length-1; i>=0; i--) {
    if (state.msgs[i].value.author === pid) {
      hasMsgs = true
      var m = com.messageSummary(state, state.msgs[i])
      if (m) msgs.push(m)
    }
  }
  if (hasMsgs) {
    if (msgs.length)
      msgfeed = h('table.table.message-feed', msgs)
    else
      msgfeed = h('p', h('strong', 'No posts have been published by this user yet.'))
  } else {
    msgfeed = h('p', 
      h('strong', 'No messages found for this user.'),
      ((!isFollowing) ? 
        h('p', 'Follow this user to begin searching the network for their data.') :
        h('p', 'Scuttlebutt is searching the network for this user.'))
    )
  }

  // render controls
  var followBtn = '', trustBtn = '', flagBtn = '', renameBtn = ''
  if (pid == state.user.id) {
    renameBtn = h('button.btn.btn-primary', {title: 'Rename', onclick: rename}, com.icon('pencil'))
  } else {
    renameBtn = h('button.btn.btn-primary', {title: 'Rename', onclick: rename}, com.icon('pencil'))
    followBtn = (isFollowing)
      ? h('button.btn.btn-primary', { onclick: delEdge('follow') }, com.icon('minus'), ' Unfollow')
      : h('button.btn.btn-primary', { onclick: addEdge('follow') }, com.icon('plus'), ' Follow')
    trustBtn = (state.hasEdge('trust', state.user.id, pid))
      ? h('button.btn.btn-danger', { onclick: delEdge('trust') }, com.icon('remove'), ' Untrust')
      : h('button.btn.btn-success', { onclick: trustPrompt }, com.icon('lock'), ' Trust')
    flagBtn = (state.hasEdge('flag', state.user.id, pid))
      ? h('button.btn.btn-success', { onclick: delEdge('flag') }, com.icon('ok'), ' Unflag')
      : h('button.btn.btn-danger',{ onclick: flagPrompt },  com.icon('flag'), ' Flag')
  } 

  // given names
  var givenNames = []
  if (profile) {
    if (profile.self.name)
      givenNames.push(h('li', profile.self.name + ' (self-assigned)'))
    Object.keys(profile.given).forEach(function(userid) {
      var given = profile.given[userid]
      if (given.name)
        givenNames.push(h('li', given.name + ' by ', com.userlink(userid, state.names[userid])))
    })
  }

  // render page
  var name = state.names[pid] || util.shortString(pid)
  var joinDate = (profile) ? util.prettydate(new Date(profile.createdAt), true) : '-'
  state.setPage(com.page(state, 'profile', h('.row',
    h('.col-xs-2.col-md-1', com.sidenav(state)),
    h('.col-xs-8', msgfeed),
    h('.col-xs-2.col-md-3.profile-controls',
      h('.section',
        h('h2', name, renameBtn),
        h('p.text-muted', 'joined '+joinDate)
      ),
      h('.section', h('p', followBtn), h('p', trustBtn), h('p', flagBtn)),
      (givenNames.length)
        ? h('.section',
          h('small', h('strong', 'Given names '), com.a('#/help/names', '?')), 
          h('br'),
          h('ul.list-unstyled', givenNames)
        )
        : '',
      h('.section',
        h('small', h('strong', 'Emoji fingerprint '), com.a('#/help/fingerprint', '?')),
        h('div', { innerHTML: com.toEmoji(pid) })
      )
    )
  )))

  // handlers

  function trustPrompt(e) {
    e.preventDefault()
    swal({
      title: 'Trust '+util.escapePlain(name)+'?',
      text: [
        'Use their data (names, trusts, flags) in your own account?',
        'Only do this if you know this account is your friend, you trust them, and you think other people should too!'
      ].join(' '),
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#12b812',
      confirmButtonText: 'Trust'
    }, function() {
      addEdge('trust')()
    })
  }

  function flagPrompt(e) {
    e.preventDefault()
    swal({
      title: 'Flag '+util.escapePlain(name)+'?',
      text: [
        'Warn people about this user?',
        'This will hurt their network reputation and cause fewer people to trust them.',
        'Only do this if you believe they are a spammer, troll, or attacker.'
      ].join(' '),
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d9534f',
      confirmButtonText: 'Flag'
    }, function() {
      addEdge('flag')()
    })
  }

  function addEdge (type) {
    return function (e) {
      e && e.preventDefault()
      if (!state.hasEdge(type, state.user.id, pid)) {
        state.addEdge(type, pid, function(err) {
          if (err) swal('Error While Publishing', err.message, 'error')
          else state.sync()
        })
      }
    }
  }

  function delEdge (type) {
    return function (e) {
      e && e.preventDefault()
      if (state.hasEdge(type, state.user.id, pid)) {
        state.delEdge(type, pid, function(err) {
          if (err) swal('Error While Publishing', err.message, 'error')
          else state.sync()
        })
      }
    }
  }

  function rename (e) {
    e.preventDefault()
    state.setNamePrompt(pid)
  }
}