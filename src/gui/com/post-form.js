var h = require('hyperscript')
var suggestBox = require('suggest-box')

module.exports = function(state, parent) {
  var textarea = h('textarea.form-control', { name: 'text', rows: 3 })
  suggestBox(textarea, state.suggestOptions) // decorate with suggestbox 

  return h('form.post-form.submit-publish-text-post' + ((!!parent) ? '.reply-form' : ''), { 'data-parent': parent },
    h('p.preview'),
    h('p,', textarea),
    h('p.post-form-btns',
      h('button.btn.btn-primary', 'Post'),
      ' ',
      h('button.btn.btn-primary.click-preview-text-post', 'Preview'),
      ' ',
      (!!parent) ? h('a.click-cancel-reply', { href: '#' }, 'Cancel') : ''
    )
  )
}