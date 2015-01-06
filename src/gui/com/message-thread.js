var h = require('hyperscript')
var com = require('./index')
var message = require('./message')

var messageOpts = { mustRender: false }
var messageThread =
module.exports = function(state, msg, opts) {
  opts = opts || messageOpts
  var r = replies(state, msg)
  opts.mustRender = !!r // always render if there are replies
  var m = com.message(state, msg, opts)
  return (m) ? h('.message-thread', [m, r]) : ''
}

function replies(state, msg) {
  // collect replies
  var r = []
  ;(msg.replies || []).forEach(function(replyId) {
    var reply = state.msgsById[replyId]
    if (!reply) return
    
    var content = reply.value.content
    if (content.type != 'post' || !content.text)
      return

    r.push(com.message(state, reply))
    r.push(replies(state, reply))
  })

  if (r.length)
    return h('.message-replies', r)
  return ''
}