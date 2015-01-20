'use strict'
var h = require('hyperscript')
var multicb = require('multicb')
var schemas = require('ssb-msg-schemas')
var com = require('../com')
var util = require('../lib/util')

module.exports = function (app) {
  var pid = app.page.param
  var done = multicb({ pluck: 1 })
  app.ssb.friends.all('follow', done())
  app.ssb.friends.all('trust', done())
  app.ssb.phoenix.getProfile(pid, done())
  app.ssb.phoenix.getPostsBy(pid, done())
  done(function (err, datas) {
    var graphs = {
      follow: datas[0],
      trust:  datas[1]
    }
    graphs.follow[app.myid] = graphs.follow[app.myid] || {}
    graphs.trust [app.myid] = graphs.trust [app.myid] || {}
    var isFollowing = graphs.follow[app.myid][pid]
    var profile = datas[2]
    var msgs = datas[3]

    // messages
    var msgfeed
    if (profile) {
      if (msgs.length)
        msgfeed = h('table.table.message-feed', msgs.map(function (msg) { if (msg.value) return com.messageSummary(app, msg) }))
      else
        msgfeed = h('div', { style: 'display: inline-block' }, com.panel('', 'No posts have been published by this user yet.'))
    } else {
      msgfeed = h('div', { style: 'display: inline-block' },
        com.panel('',
          h('div',
            h('strong', 'No messages found for this user.'), h('br'),
            ((!isFollowing) ? 
              h('span', 'Follow this user to begin searching the network for their data.') :
              h('span', 'Scuttlebutt is searching the network for this user.'))
          )
        )
      )
    }

    // name confidence controls
    var nameTrustDlg
    if (app.nameTrustRanks[pid] !== 1) {
      nameTrustDlg = h('.well',
        h('h3', { style: 'margin-top: 0' }, (!!app.names[pid]) ? 'Is this "'+app.names[pid]+'?"' : 'Who is this user?'),
        h('p',
          'Users whose identity you haven\'t confirmed will have a ',
          h('span.text-muted', com.icon('user'), '?'),
          ' next to their name.'
        ),
        (!!app.names[pid]) ?
          [
            h('button.btn.btn-primary', {style: 'border-color: #ddd', onclick: confirmName}, 'Confirm This Name'),
            ' or ',
            h('button.btn.btn-primary', {style: 'border-color: #ddd', onclick: rename}, 'Choose Another Name')
          ] :
          h('button.btn.btn-primary', {style: 'border-color: #ddd', onclick: rename}, 'Choose a Name')
      )
    }

    // profile controls
    var followBtn = '', trustBtn = '', flagBtn = '', renameBtn = ''
    if (pid === app.myid) {
      renameBtn = h('button.btn.btn-primary', {title: 'Rename', onclick: rename}, com.icon('pencil'))
    } else {
      renameBtn = h('button.btn.btn-primary', {title: 'Rename', onclick: rename}, com.icon('pencil'))
      followBtn = (isFollowing)
        ? h('button.btn.btn-primary', { onclick: unfollow }, com.icon('minus'), ' Unfollow')
        : h('button.btn.btn-primary', { onclick: follow }, com.icon('plus'), ' Follow')
      trustBtn = (graphs.trust[app.myid][pid] == 1)
        ? h('button.btn.btn-danger', { onclick: detrust }, com.icon('remove'), ' Untrust')
        : (!graphs.trust[app.myid][pid])
          ? h('button.btn.btn-success', { onclick: trustPrompt }, com.icon('lock'), ' Trust')
          : ''
      flagBtn = (graphs.trust[app.myid][pid] == -1)
        ? h('button.btn.btn-success', { onclick: detrust }, com.icon('ok'), ' Unflag')
        : (!graphs.trust[app.myid][pid])
          ? h('button.btn.btn-danger',{ onclick: flagPrompt },  com.icon('flag'), ' Flag')
          : ''
    } 

    // given names
    var givenNames = []
    if (profile) {
      if (profile.self.name)
        givenNames.push(h('li', profile.self.name + ' (self-assigned)'))
      Object.keys(profile.assignedBy).forEach(function(userid) {
        var given = profile.assignedBy[userid]
        if (given.name)
          givenNames.push(h('li', given.name + ' by ', com.userlink(userid, app.names[userid])))
      })
    }

    // render page
    var name = app.names[pid] || util.shortString(pid)
    var joinDate = (profile) ? util.prettydate(new Date(profile.createdAt), true) : '-'
    app.setPage('profile', h('.row',
      h('.col-xs-2.col-md-1', com.sidenav(app)),
      h('.col-xs-8', nameTrustDlg, msgfeed),
      h('.col-xs-2.col-md-3.profile-controls',
        h('.section',
          h('h2', name, com.nameConfidence(pid, app), renameBtn),
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
    ))

    // handlers

    function trustPrompt (e) {
      e.preventDefault()
      swal({
        title: 'Trust '+util.escapePlain(name)+'?',
        text: [
          'Use their data (names, trusts, flags) in your own account?',
          'Only do this if you know this account is your friend\'s, you trust them, and you think other people should too!'
        ].join(' '),
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#12b812',
        confirmButtonText: 'Trust'
      }, function() {
        schemas.addTrust(app.ssb, pid, 1, function (err) {
          if (err) swal('Error While Publishing', err.message, 'error')
          else app.refreshPage()
        })
      })
    }

    function flagPrompt (e) {
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
        schemas.addTrust(app.ssb, pid, -1, function (err) {
          if (err) swal('Error While Publishing', err.message, 'error')
          else app.refreshPage()
        })
      })
    }

    function detrust (e) {
      e.preventDefault()
      schemas.addTrust(app.ssb, pid, 0, function(err) {
        if (err) swal('Error While Publishing', err.message, 'error')
        else app.refreshPage()
      })
    }
    
    function follow (e) {
      e.preventDefault()
      if (!graphs.follow[app.myid][pid]) {
        schemas.addFollow(app.ssb, pid, function(err) {
          if (err) swal('Error While Publishing', err.message, 'error')
          else app.refreshPage()
        })
      }
    }

    function unfollow (e) {
      e.preventDefault()
      if (graphs.follow[app.myid][pid]) {
        schemas.addUnfollow(app.ssb, pid, function(err) {
          if (err) swal('Error While Publishing', err.message, 'error')
          else app.refreshPage()
        })
      }
    }

    function rename (e) {
      e.preventDefault()
      app.setNamePrompt(pid)
    }

    function confirmName (e) {
      e.preventDefault()
      schemas.addOtherName(app.ssb, pid, app.names[pid], function (err) {
        if (err) swal('Error While Publishing', err.message, 'error')
        else app.refreshPage()
      })
    }
  })
}