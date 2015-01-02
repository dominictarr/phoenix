var com = require('../com')
var util = require('../../lib/util')
var markdown = require('../../lib/markdown')

exports.submit = function(state, el, e) {
  var form = (el.tagName == 'FORM') ? el : el.form
  var text = form.text.value

  state.apis.feed.postAdvert(text, function (err) {
    if (err) alert(err.message)
    else {
      form.text.value = ''
      var previewEl = form.querySelector('.preview')
      previewEl.innerHTML = ''
      state.sync()
    }
  })
}

exports.preview = function(state, el, e) {
  var form = (el.tagName == 'FORM') ? el : el.form
  var text = form.text.value

  var previewEl = form.querySelector('.preview')
  previewEl.innerHTML = markdown.block(util.escapePlain(text), state.names)
}