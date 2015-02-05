'use strict'
var h = require('hyperscript')
var com = require('./index')

var messageOpts = { mustRender: false, topmost: true }
module.exports = function (app, thread, opts) {
  opts = opts || messageOpts
  var r = replies(app, thread)
  opts.mustRender = !!r // always render if there are replies
  opts.topmost = true // always topmost
  var m = com.message(app, thread, opts)
  return (m) ? h('.message-thread', [m, r]) : ''
}

function replies (app, thread) {
  // collect replies
  var r = []
  ;(thread.related || thread.replies || []).forEach(function(reply) {
    r.push(com.message(app, reply))
    r.push(replies(app, reply))
  })

  if (r.length)
    return h('.message-replies', r)
  return ''
}
