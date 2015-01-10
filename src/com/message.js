var h = require('hyperscript')
var com = require('./index')
var util = require('../lib/util')
var markdown = require('../lib/markdown')

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
      content = h('div', { innerHTML: markdown.block(util.escapePlain(md), app.api.getNames()) })
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
    var name = app.api.getNameById($1) || $1
    return '"feed": "<a class="user-link" href="/#/profile/'+$1+'">'+name+'</a>"'
  })

  // turn message references into links
  json = json.replace(/\"msg\": \"([^\"]+)\"/g, function($0, $1) {
    return '"msg": "<a href="/#/msg/'+$1+'">'+$1+'</a>"'
  })

  return h('.message-raw', { innerHTML: json })
}

function renderMsgShell(app, msg, content) {

  // markup 

  var nReplies = app.api.getNumReplies(msg.key)
  var repliesStr = ''
  if (nReplies == 1) repliesStr = ' (1 reply)'
  if (nReplies > 1) repliesStr = ' ('+nReplies+' replies)'

  var msgbody = h('.panel-body', content)
  var msgpanel = h('.panel.panel-default.message',
    h('.panel-heading',
      com.userlink(msg.value.author, app.api.getNameById(msg.value.author)),
      ' ', com.a('#/msg/'+msg.key, util.prettydate(new Date(msg.value.timestamp), true)+repliesStr, { title: 'View message thread' }),
      h('span', {innerHTML: ' &middot; '}), h('a', { title: 'Reply', href: '#', onclick: reply }, 'reply')
    ),
    msgbody
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