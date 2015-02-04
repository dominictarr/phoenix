'use strict'
var h = require('hyperscript')
var mlib = require('ssb-msgs')
var com = require('./index')
var util = require('../lib/util')
var markdown = require('../lib/markdown')
var mentions = require('../lib/mentions')

module.exports = function (app, msg, opts) {
  var content
  if (opts && opts.raw) {
    content = messageRaw(app, msg)
  } else {
    if (msg.value.content.type == 'post') {
      var md = msg.value.content.text
      if ((!opts || !opts.fullLength) && md.length >= 512) {
        md = md.slice(0, 512) + '... [read more](#/msg/'+msg.key+')'
      }
      content = h('div', { innerHTML: mentions.post(markdown.block(md), app, msg) })
    } else {
      if (!opts || !opts.mustRender)
        return ''
      content = messageRaw(app, msg)
    }
  }    
  return renderMsgShell(app, msg, content)
}

function messageRaw (app, msg) {
  var obj = (false/*app.page.renderMode == 'rawfull'*/) ? msg.value : msg.value.content
  var json = util.escapePlain(JSON.stringify(obj, null, 2))

  // turn feed references into links
  json = json.replace(/\"feed\": \"([^\"]+)\"/g, function($0, $1) {
    var name = app.names[$1] || $1
    return '"feed": "<a class="user-link" href="/#/profile/'+$1+'">'+name+'</a>"'
  })

  // turn message references into links
  json = json.replace(/\"msg\": \"([^\"]+)\"/g, function($0, $1) {
    return '"msg": "<a href="/#/msg/'+$1+'">'+$1+'</a>"'
  })

  return h('.message-raw', { innerHTML: json })
}

var attachmentOpts = { toext: true, rel: 'attachment' }
function renderMsgShell(app, msg, content) {

  // markup 

  var nReplies = (msg.replies) ? msg.replies.length : 0
  var repliesStr = ''
  if (nReplies == 1) repliesStr = ' (1 reply)'
  if (nReplies > 1) repliesStr = ' ('+nReplies+' replies)'

  var msgfooter
  var attachments = mlib.getLinks(msg.value.content, attachmentOpts)
  if (attachments.length) {
    msgfooter = h('.panel-footer',
      h('ul', attachments.map(function (link) {
        var url = '#/ext/'+link.ext
        if (link.name)
          url += '?name='+encodeURIComponent(link.name)+'&msg='+encodeURIComponent(msg.key)
        return h('li', h('a', { href: url }, link.name || util.shortString(link.ext)))
      }))
    )
  }

  var msgbody = h('.panel-body', content)
  var msgpanel = h('.panel.panel-default.message',
    h('.panel-heading',
      com.userlink(msg.value.author, app.names[msg.value.author]), com.nameConfidence(msg.value.author, app),
      ' ', com.a('#/msg/'+msg.key, util.prettydate(new Date(msg.value.timestamp), true)+repliesStr, { title: 'View message thread' }),
      h('span.in-response-to'), // may be populated by the message page
      h('span', {innerHTML: ' &middot; '}), h('a', { title: 'Reply', href: '#', onclick: reply }, 'reply')
    ),
    msgbody,
    msgfooter
  )

  // handlers

  function reply (e) {
    e.preventDefault()

    if (!msgbody.nextSibling || !msgbody.nextSibling.classList || !msgbody.nextSibling.classList.contains('reply-form')) {
      var form = com.postForm(app, msg.key)
      if (msgbody.nextSibling)
        msgbody.parentNode.insertBefore(form, msgbody.nextSibling)
      else
        msgbody.parentNode.appendChild(form)
    }
  }

  return msgpanel
}