'use strict'
var h = require('hyperscript')
var com = require('./index')
var util = require('../lib/util')
var markdown = require('../lib/markdown')

module.exports = function (app, msg, opts) {

  // markup

  var content, isRaw
  if (msg.value.content.type == 'post') {
    content = msg.value.content.text
  } else {
    if (!opts || !opts.mustRender)
      return ''
    content = JSON.stringify(msg.value.content)
    isRaw = true
  }
  content = util.escapePlain(content)
  content = markdown.emojis(content)
  content = markdown.mentionLinks(content, app.names, true)

  var len = noHtmlLen(content)
  if (len > 60 || content.length > 512) {
    content = content.slice(0, Math.min(60 + (content.length - len), 512)) + '...'
  }

  var nReplies = msg.numThreadReplies
  var repliesStr = ''
  if (nReplies)
    repliesStr = ' ('+nReplies+')'

  var name = app.names[msg.value.author] || util.shortString(msg.value.author)
  var nameConfidence = com.nameConfidence(msg.value.author, app)
  return h('tr.message-summary', { onclick: openMsg },
    h('td', name, nameConfidence, repliesStr),
    h('td', h((isRaw) ? 'code' : 'span', { innerHTML: content })),
    h('td.text-muted', util.prettydate(new Date(msg.value.timestamp), true))
  )

  // handlers

  function openMsg (e) {
    // abort if clicked on a sub-link
    var el = e.target
    while (el) {
      if (el.tagName == 'A')
        return
      el = el.parentNode
    }

    e.preventDefault()
    window.location.hash = '#/msg/'+msg.key
  }
}

function noHtmlLen (str) {
  var entityLen = 0
  str.replace(/<.*>/g, function($0) {
    entityLen += $0.length
  })
  return str.length - entityLen
}