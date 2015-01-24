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
  var fetchOpts = { start: 0 }  
  app.ssb.phoenix.getPostsBy(pid, fetchOpts, done())
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
        msgfeed = h('table.table.message-feed', msgs.map(function (msg) {
          if (msg.value) return com.messageSummary(app, msg)
        }))
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
          givenNames.push(h('li', given.name + ' by ', com.userlinkThin(userid, app.names[userid])))
      })
    }

    // follows, trusts, flags
    function outEdges(g, v) {
      var arr = []
      if (g[pid]) {
        for (var userid in g[pid]) {
          if (g[pid][userid] == v)
            arr.push(h('li', com.userlinkThin(userid, app.names[userid])))
        }
      }
      return arr
    }
    function inEdges(g, v) {
      var arr = []
      for (var userid in g) {
        if (g[userid][pid] == v)
          arr.push(h('li', com.userlinkThin(userid, app.names[userid])))
      }
      return arr      
    }
    var follows   = outEdges(graphs.follow, true)
    var followers = inEdges(graphs.follow, true)
    var trusts    = outEdges(graphs.trust, 1)
    var trusters  = inEdges(graphs.trust, 1)
    var flags     = outEdges(graphs.trust, -1)
    var flaggers  = inEdges(graphs.trust, -1)

    // render page
    var name = app.names[pid] || util.shortString(pid)
    var joinDate = (profile) ? util.prettydate(new Date(profile.createdAt), true) : '-'
    var loadMoreBtn = (msgs.length === 30) ? h('p', h('button.btn.btn-primary.btn-block', { onclick: loadMore, style: 'margin-bottom: 24px' }, 'Load More')) : ''    
    app.setPage('profile', h('.row',
      h('.col-xs-2.col-md-1', com.sidenav(app)),
      h('.col-xs-8', nameTrustDlg, msgfeed, loadMoreBtn),
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
        trusters.length  ? h('.section', h('small', h('strong.text-success', com.icon('ok'), ' Trusted by'), ' ', com.a('#/help/trust', '?')), h('br'), h('ul.list-unstyled', trusters)) : '',
        flaggers.length  ? h('.section', h('small', h('strong.text-danger', com.icon('flag'), ' Flagged by'), ' ', com.a('#/help/trust', '?')), h('br'), h('ul.list-unstyled', flaggers)) : '',
        follows.length   ? h('.section', h('small', h('strong', 'Follows'), ' ', com.a('#/help/contacts', '?')), h('br'), h('ul.list-unstyled', follows)) : '',
        followers.length ? h('.section', h('small', h('strong', 'Followed by'), ' ', com.a('#/help/contacts', '?')), h('br'), h('ul.list-unstyled', followers)) : '',
        trusts.length    ? h('.section', h('small', h('strong', 'Trusts'), ' ', com.a('#/help/trust', '?')), h('br'), h('ul.list-unstyled', trusts)) : '',
        flags.length     ? h('.section', h('small', h('strong', 'Flags'), ' ', com.a('#/help/trust', '?')), h('br'), h('ul.list-unstyled', flags)) : '',
        h('.section',
          h('small', h('strong', 'Emoji fingerprint '), com.a('#/help/trust', '?')),
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

    function loadMore (e) {
      e.preventDefault()
      fetchOpts.start += 30
      app.ssb.phoenix.getPostsBy(pid, fetchOpts, function (err, moreMsgs) {
        if (moreMsgs.length > 0) {
          moreMsgs.forEach(function (msg) { 
            if (msg.value) msgfeed.appendChild(com.messageSummary(app, msg))
          })
        }
        // remove load more btn if it looks like there arent any more to load
        if (moreMsgs.length < 30)
          loadMoreBtn.parentNode.removeChild(loadMoreBtn)
      })
    }
  })
}