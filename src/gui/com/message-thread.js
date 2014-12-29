var h = require('hyperscript')
var com = require('./index')
var message = require('./message')

var messageOpts = { mustRender: false }
var messageThread =
module.exports = function(state, msg) {
  var r = replies(state, msg)
  messageOpts.mustRender = !!r // always render if there are replies
  return h('.message-thread', [
    com.message(state, msg, messageOpts),
    r
  ])
}

function replies(state, msg) {
  // collect replies
  var r = []
  ;(msg.replies || []).forEach(function(replyId) {
    var reply = state.msgsById[replyId]
    if (!reply) return
    
    var content = reply.value.content
    if (content.type != 'post' || content.postType != 'text')
      return

    r.push(com.message(state, reply))
    r.push(replies(state, reply))
  })

  if (r.length)
    return h('.message-replies', r)
  return ''
}