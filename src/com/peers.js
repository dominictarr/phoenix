'use strict'
var h = require('hyperscript')
var com = require('./index')
var util = require('../lib/util')

module.exports = function (app, peers) {

  // markup

  var rows = peers.sort(sorter).map(function (peer) { 
    var muted = (peer.connected) ? '' : '.text-muted'
    var id = '', status = '', history = ''

    if (peer.id) {
      id = com.userlink(peer.id, app.names[peer.id])
    } else
      id = peer.host

    if (peer.connected) {
      if (peer.time.connect)
        status = 'connected'
      else {
        if (peer.failure)
          status = 'connecting (try '+(peer.failure+1)+')...'
        else
          status = 'connecting...'
      }
    }

    if (peer.time) {
      if (peer.time.connect > peer.time.attempt)
        history = 'connected '+util.prettydate(peer.time.connect, true)
      else if (peer.time.attempt) {
        if (peer.connected)
          history = 'started attempt '+util.prettydate(peer.time.attempt, true)
        else
          history = 'attempted connect '+util.prettydate(peer.time.attempt, true)
      }
    }

    return h('tr',
      h('td'+muted, 
        (peer.connected) ? '' : h('a.btn.btn-xs.btn-default', { href: '#', title: 'Syncronize now', onclick: syncronize(peer) }, com.icon('transfer')),
        id, ' ', status, h('br'), 
        h('small.text-muted', history)
      )
    )
  })

  // put connected peers at top
  function sorter(a, b) {
    var an = 0, bn = 0
    if (a.connected) an += 100
    if (b.connected) bn += 100
    if (a.failure) an -= a.failure
    if (b.failure) bn -= b.failure
    return bn - an
  }

  // handlers

  function syncronize (p) {
    return function (e) {
      e.preventDefault()
      app.ssb.gossip.connect(p, function (err) {
        if (err)
          console.error(err)
        app.pollPeers()        
      })
    }
  }

  return rows
}