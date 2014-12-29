var h = require('hyperscript')
var com = require('./index')
var util = require('../../lib/util')
var markdown = require('../../lib/markdown')

module.exports = function(state, msg) {
  var content
  if (state.page.renderMode == 'markdown' && msg.markdown)
    content = h('div', { innerHTML: markdown.block(util.escapePlain(msg.markdown), state.nicknames) })
  else
    content = messageRaw(state, msg)
  return renderMsgShell(state, msg, content)
}

function messageRaw(state, msg) {
  var obj = (state.page.renderMode == 'rawfull') ? msg.value : msg.value.content
  var json = util.escapePlain(JSON.stringify(obj, null, 2))

  // turn feed references into links
  json = json.replace(/\"feed\": \"([^\"]+)\"/g, function($0, $1) {
    var nick = state.nicknames[$1] || $1
    return '"feed": "<a class="user-link" href="/#/profile/'+$1+'">'+nick+'</a>"'
  })

  // turn message references into links
  json = json.replace(/\"msg\": \"([^\"]+)\"/g, function($0, $1) {
    return '"msg": "<a href="/#/msg/'+$1+'">'+$1+'</a>"'
  })

  return h('.message-raw', { innerHTML: json })
}

function renderMsgShell(state, msg, content) {
  return h('.panel.panel-default.message', [
    renderMsgHeader(state, msg),
    h('.panel-body', content),
    renderMsgFooter(state, msg)
  ])
}

function renderMsgHeader(state, msg) {
  var nTextReplies = getReplies(state, msg, 'text').length
  var repliesStr = ''
  if (nTextReplies == 1) repliesStr = ' (1 reply)'
  if (nTextReplies > 1) repliesStr = ' ('+nTextReplies+' replies)'

  return h('.panel-heading', [
    com.userlink(msg.value.author, state.nicknames[msg.value.author]),
    ' ',
    h('span.extra', 
      h('span', { innerHTML: com.toEmoji(msg.value.author.slice(0,16), 12) }),
      ' ', com.a('#/msg/'+msg.key, 'posted '+util.prettydate(new Date(msg.value.timestamp), true)+repliesStr, { title: 'View message thread' }),
      ' . ', h('a.click-reply', { title: 'Reply', href: '#', 'data-msgid': msg.key }, com.icon('comment'), ' reply'),
      ' . ', h('a.click-react', { title: 'React', href: '#', 'data-msgid': msg.key }, com.icon('hand-up'), ' react')
    )
  ])
}

function renderMsgFooter(state, msg) {
  var reactions = getReplies(state, msg, 'action').map(function(reaction) {
    return [com.userlink(reaction.value.author, state.nicknames[reaction.value.author]), ' ', reaction.value.content.text, ' this. ']
  })
  if (reactions.length)
    return h('.panel-footer', reactions)
  return ''
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