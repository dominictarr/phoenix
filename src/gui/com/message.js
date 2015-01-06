var h = require('hyperscript')
var com = require('./index')
var util = require('../../lib/util')
var markdown = require('../../lib/markdown')

module.exports = function(state, msg, opts) {
  var content
  if (opts && opts.raw) {
    content = messageRaw(state, msg)
  } else {
    if (!msg.markdown) {
      if (!opts || !opts.mustRender)
        return ''
      content = messageRaw(state, msg)
    } else {
      md = msg.markdown
      if ((!opts || !opts.fullLength) && md.length >= 512) {
        md = md.slice(0, 512) + '... [read more](#/msg/'+msg.key+')'
      }
      content = h('div', { innerHTML: markdown.block(util.escapePlain(md), state.names) })
    }
  }    
  return renderMsgShell(state, msg, content)
}

function messageRaw(state, msg) {
  var obj = (false/*state.page.renderMode == 'rawfull'*/) ? msg.value : msg.value.content
  var json = util.escapePlain(JSON.stringify(obj, null, 2))

  // turn feed references into links
  json = json.replace(/\"feed\": \"([^\"]+)\"/g, function($0, $1) {
    var name = state.names[$1] || $1
    return '"feed": "<a class="user-link" href="/#/profile/'+$1+'">'+name+'</a>"'
  })

  // turn message references into links
  json = json.replace(/\"msg\": \"([^\"]+)\"/g, function($0, $1) {
    return '"msg": "<a href="/#/msg/'+$1+'">'+$1+'</a>"'
  })

  return h('.message-raw', { innerHTML: json })
}

function renderMsgShell(state, msg, content) {

  // markup 

  var nTextReplies = getReplies(state, msg, 'text').length
  var repliesStr = ''
  if (nTextReplies == 1) repliesStr = ' (1 reply)'
  if (nTextReplies > 1) repliesStr = ' ('+nTextReplies+' replies)'

  var msgbody = h('.panel-body', content)
  var msgpanel = h('.panel.panel-default.message',
    h('.panel-heading',
      com.userlink(msg.value.author, state.names[msg.value.author]),
      ' ', com.a('#/msg/'+msg.key, util.prettydate(new Date(msg.value.timestamp), true)+repliesStr, { title: 'View message thread' }),
      h('span', {innerHTML: ' &middot; '}), h('a', { title: 'Reply', href: '#', onclick: reply }, 'reply')
    ),
    msgbody
  )

  // handlers

  function reply (e) {
    e.preventDefault()

    if (!msgbody.nextSibling || !msgbody.nextSibling.classList || !msgbody.nextSibling.classList.contains('reply-form')) {
      var form = com.postForm(state, msg.key)
      if (msgbody.nextSibling)
        msgbody.parentNode.insertBefore(form, msgbody.nextSibling)
      else
        msgbody.parentNode.appendChild(form)
    }
  }

  return msgpanel
}


function getReplies(state, msg, typeFilter) {
  return (msg.replies || [])
    .map(function(id) { return state.msgsById[id] })
    .filter(function(reply) {
      if (!reply) return false
      if (typeFilter && reply.value.content.postType != typeFilter) return false
      return true
    })
}