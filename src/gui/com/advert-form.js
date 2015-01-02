var h = require('hyperscript')
var suggestBox = require('suggest-box')

module.exports = function(state) {
  var textarea = h('textarea.form-control', { name: 'text', rows: 3 })
  suggestBox(textarea, state.suggestOptions) // decorate with suggestbox 

  return h('form.advert-form.submit-publish-advert-post',
    h('.preview.well.well-sm'),
    h('p,', textarea),
    h('p.post-form-btns',
      h('button.btn.btn-default', 'Advertise'),
      ' ',
      h('button.btn.btn-default.click-preview-advert-post', 'Preview')
    )
  )
}