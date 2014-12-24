var h = require('hyperscript')
var com = require('./index')
var message = require('./message')

var messageThread =
module.exports = function(state, msg) {
  return h('.message-thread', [
    com.message(state, msg),
    replies(state, msg)
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