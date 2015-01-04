var h = require('hyperscript')
var suggestBox = require('suggest-box')

module.exports = function(state) {
  var textarea = h('textarea.form-control', { name: 'text', rows: 3 })
  suggestBox(textarea, state.suggestOptions) // decorate with suggestbox 

  return h('form.advert-form.submit-publish-advert-post',
    h('.open',
      h('.preview.well.well-sm.col-xs-3'),
      h('p,', textarea),
      h('p.post-form-btns',
        h('button.btn.btn-primary', 'Post'),
        ' ',
        h('button.btn.btn-primary.click-preview-advert-post', 'Preview'),
        ' ',
        h('button.btn.btn-primary.click-cancel-advert', { href: '#' }, 'Cancel')
      )
    ),
    h('.closed', h('button.btn.btn-primary.click-newadvert', 'New Advert'))
  )
}