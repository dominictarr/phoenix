'use strict'
var h = require('hyperscript')
var suggestBox = require('suggest-box')
var schemas = require('ssb-msg-schemas')
var createHash = require('multiblob/util').createHash
var pull = require('pull-stream')
var pushable = require('pull-pushable')
var util = require('../lib/util')
var markdown = require('../lib/markdown')

module.exports = function (app, parent) {

  var attachments = []
  var namesList = {} // a name->name map for the previews
  for (var id in app.names)
    namesList[app.names[id]] = app.names[id]

  // markup

  var preview = h('.preview')
  var filesInput = h('input.hidden', { type: 'file', multiple: true, onchange: filesAdded })  
  var filesList = h('ul')
  var textarea = h('textarea', { name: 'text', placeholder: 'Compose your message', rows: 6, onblur: renderPreview })
  suggestBox(textarea, app.suggestOptions) // decorate with suggestbox 

  var form = h('form.post-form' + ((!!parent) ? '.reply-form' : ''), { onsubmit: post },
    h('div',
      h('.post-form-textarea', textarea),
      h('.post-form-attachments',
        filesList,
        h('a', { href: '#', onclick: addFile }, 'Click here to add an attachment'),
        filesInput
      )
    ),
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

    app.setStatus('info', 'Posting...')
    uploadFiles(function (err, extLinks) {
      if (err)
        return swal('Error Uploading Attachments', err.message, 'error')

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
        var post = (parent) ? schemas.schemas.replyPost(text, parent, opts) : schemas.schemas.post(text, opts)
        if (extLinks.length)
          post.attachments = extLinks
        app.ssb.add(post, function (err) {
          app.setStatus(null)
          if (err) swal('Error While Publishing', err.message, 'error')
          else {
            if (parent)
              app.refreshPage()
            else
              window.location.hash = '#/'
          }
        })
      })
    })
  }

  function cancel (e) {
    e.preventDefault()
    if (parent)
      form.parentNode.removeChild(form)
    else
      window.location.hash = '#/'
  }

  function addFile (e) {
    e.preventDefault()
    filesInput.click() // trigger file-selector
  }

  function removeFile (index) {
    return function (e) {
      e.preventDefault()
      attachments.splice(index, 1)
      renderAttachments()
    }
  }

  function filesAdded (e) {
    for (var i=0; i < filesInput.files.length; i++)
      attachments.push(filesInput.files[i])
    renderAttachments()
  }

  function uploadFiles (cb) {
    var links = []
    if (attachments.length === 0)
      return cb(null, links)

    app.setStatus('info', 'Uploading ('+attachments.length+' files left)...')
    attachments.forEach(function (file) {
      var link = { rel: 'attachment', ext: null, name: null, size: null }
      links.push(link)

      // read file
      var ps = pushable()
      var reader = new FileReader()
      reader.onload = function () {
        var base64encoded = reader.result.split(',').slice(1).join(',') // drop data-url prefix
        ps.push(base64encoded)
        ps.end()
      }
      reader.onerror = function (e) {
        console.error(e)
        ps.end(new Error('Failed to upload '+file.name))
      }
      reader.readAsDataURL(file)

      // hash and store
      var hasher = createHash()
      pull(
        ps,
        hasher,
        app.ssb.blobs.add(function (err) {
          if(err) return next(err)
          link.name = file.name
          link.ext  = hasher.digest
          link.size = file.size || hasher.size
          next()
        })
      )
    })

    var n = 0
    function next (err) {
      console.log('next', n)
      if (n < 0) return
      if (err) {
        n = -1
        return cb (err)
      }
      n++
      console.log('done?', n, attachments.length)
      app.setStatus('info', 'Uploading ('+(attachments.length-n)+' files left)...')
      if (n === attachments.length)
        cb(null, links)
    }
  }

  function renderAttachments () {
    filesList.innerHTML = ''
    attachments.forEach(function (file, i) {
      filesList.appendChild(h('li', file.name, ' ', h('a', { href: '#', onclick: removeFile(i) }, 'remove')))
    })
  }

  return form
}