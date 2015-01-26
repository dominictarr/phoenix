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
        history = [h('br'), h('small.text-muted', 'connected '+util.prettydate(peer.time.connect, true))]
      else if (peer.time.attempt)
        history = [h('br'), h('small.text-muted', 'attempted connect '+util.prettydate(peer.time.attempt, true))]
    }

    return h('tr',
      h('td'+muted, id, ' ', status, history)
    )
  })

  // put followed and trusted friends at top
  function sorter(a, b) {
    var an = 0, bn = 0
    if (a.connected) an += 100
    if (b.connected) bn += 100
    if (a.failure) an -= a.failure
    if (b.failure) bn -= b.failure
    return bn - an
  }

  return rows
}