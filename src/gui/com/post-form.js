var h = require('hyperscript')
var suggestBox = require('suggest-box')
var util = require('../../lib/util')
var markdown = require('../../lib/markdown')

module.exports = function(state, parent) {

  // markup

  var textarea = h('textarea.form-control', { name: 'text', rows: 6, onblur: preview })
  suggestBox(textarea, state.suggestOptions) // decorate with suggestbox 

  var preview = h('.preview')
  var form = h('form.post-form' + ((!!parent) ? '.reply-form' : ''), { onsubmit: post },
    h('p', textarea),
    h('p.post-form-btns', h('button.btn.btn-primary.pull-right', 'Post'), h('button.btn.btn-primary', { onclick: cancel }, 'Cancel')),
    h('.preview-wrapper.panel.panel-default',
      h('.panel-heading', h('small', 'Preview:')),
      h('.panel-body', preview)
    )
  )

  // handlers

  function preview (e) {
    preview.innerHTML = markdown.block(util.escapePlain(textarea.value), state.names)
  }

  function post (e) {
    e.preventDefault()

    var text = textarea.value
    if (parent) state.apis.feed.postReply(text, parent, done)
    else state.apis.feed.postText(text, done)
      
    function done(err) {
      if (err) swal('Error While Publishing', err.message, 'error')
      else {
        if (parent)
          state.sync()
        else
          window.location.hash = '#/'
      }
    }
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