'use strict'
var h = require('hyperscript')
var suggestBox = require('suggest-box')
var schemas = require('ssb-msg-schemas')
var util = require('../lib/util')
var markdown = require('../lib/markdown')

module.exports = function (app, parent) {

  // a name->name map for the previews
  var namesList = {}
  for (var id in app.names)
    namesList[app.names[id]] = app.names[id]

  // markup

  var textarea = h('textarea.form-control', { name: 'text', rows: 6, onblur: renderPreview })
  suggestBox(textarea, app.suggestOptions) // decorate with suggestbox 

  var preview = h('.preview')
  var form = h('form.post-form' + ((!!parent) ? '.reply-form' : ''), { onsubmit: post },
    h('p', textarea),
    h('p.post-form-btns', h('button.btn.btn-primary.pull-right', 'Post'), h('button.btn.btn-primary', { onclick: cancel }, 'Cancel')),
    h('.preview-wrapper.panel.panel-default',
      h('.panel-heading', h('small', 'Preview:')),
      h('.panel-body', preview)
    ),
    h('.text-muted', 'All posts are public. Markdown, @-mentions, and emojis are supported.')
  )

  // handlers

  function renderPreview (e) {
    preview.innerHTML = markdown.mentionLinks(markdown.block(util.escapePlain(textarea.value)), namesList, true)
  }

  function post (e) {
    e.preventDefault()

    // prep text
    app.ssb.phoenix.getIdsByName(function (err, idsByName) {
      var text = textarea.value

      // collect any mentions and replace the nicknames with ids
      var mentions = []
      var mentionRegex = /(\s|>|^)@([^\s^<]+)/g;
      text = text.replace(mentionRegex, function(full, $1, $2) {
        var id = idsByName[$2] || $2
        if (schemas.isHash(id))
          mentions.push(id)
        return ($1||'') + '@' + id
      })

      // post
      var opts = null
      if (mentions.length)
        opts = { mentions: mentions }
      if (parent) schemas.addReplyPost(app.ssb, text, parent, opts, done)
      else schemas.addPost(app.ssb, text, opts, done)
        
      function done (err) {
        if (err) swal('Error While Publishing', err.message, 'error')
        else {
          if (parent)
            app.refreshPage()
          else
            window.location.hash = '#/'
        }
      }
    })
  }

  function cancel (e) {
    e.preventDefault()
    if (parent)
      form.parentNode.removeChild(form)
    else
      window.location.hash = '#/'
  }

  return form
}