var h = require('hyperscript')
var com = require('./index')
var util = require('../../lib/util')
var markdown = require('../../lib/markdown')

module.exports = function(state, msg, opts) {
  var content = msg.markdown
  if (!content) {
    if (!opts || !opts.mustRender)
      return ''
    content = JSON.stringify(msg.value.content)
  }
  content = util.escapePlain(content)
  content = markdown.emojis(content)
  content = markdown.mentionLinks(content, state.names)

  var len = noHtmlLen(content)
  if (len > 60)
    content = content.slice(0, 60 + (content.length - len)) + '...'

  var nTextReplies = getReplies(state, msg, 'text').length
  var repliesStr = ''
  if (nTextReplies)
    repliesStr = ' ('+nTextReplies+')'

  return h('tr.message-summary.click-navigate', {href: '#/msg/'+msg.key},
    h('td', state.names[msg.value.author] + repliesStr),
    h('td', h('span', { innerHTML: content })),
    h('td.text-muted', util.prettydate(new Date(msg.value.timestamp), true))
  )
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

function noHtmlLen(str) {
  var entityLen = 0
  str.replace(/<.*>/g, function($0) {
    entityLen += $0.length
  })
  return str.length - entityLen
}