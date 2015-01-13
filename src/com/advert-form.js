var h = require('hyperscript')
var suggestBox = require('suggest-box')
var util = require('../lib/util')
var markdown = require('../lib/markdown')

module.exports = function (app) {
  
  // markup

  var textarea = h('textarea.form-control', { name: 'text', rows: 3, onblur: preview })
  suggestBox(textarea, app.suggestOptions) // decorate with suggest box

  var preview = h('.preview.well.well-sm.col-xs-3')
  var form = h('form.advert-form', { onsubmit: post },
    h('.open',
      preview,
      h('p', textarea),
      h('p.post-form-btns', h('button.btn.btn-primary', 'Post'), ' ', h('button.btn.btn-primary', { href: '#', onclick: close }, 'Cancel'))
    ),
    h('.closed', h('button.btn.btn-primary', { onclick: open }, 'New Advert'))
  )

  // event handlers

  function preview (e) {
    preview.innerHTML = markdown.block(util.escapePlain(textarea.value), app.names)
  }

  function post (e) {
    e.preventDefault()
    app.ssb.phoenix.postAdvert(textarea.value, function (err) {
      if (err) swal('Error While Publishing', err.message, 'error')
      else {
        swal('Your Ad Has Been Published', null, 'success')
        app.refreshPage()
      }
    })
  }

  function open (e) {
    e.preventDefault()
    form.classList.add('opened')
  }

  function close (e) {
    e.preventDefault()
    form.reset()
    form.classList.remove('opened')
    preview.innerHTML = ''
  }

  return form
}