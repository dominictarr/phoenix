var h = require('hyperscript')
var suggestBox = require('suggest-box')

module.exports = function(state, parent) {
  var textarea = h('textarea.form-control', { name: 'text', rows: 3 })
  suggestBox(textarea, state.suggestOptions) // decorate with suggestbox 

  return h('form.post-form.submit-publish-text-post' + ((!!parent) ? '.reply-form.opened' : ''), { 'data-parent': parent },
    h('p.preview'),
    h('.open',
      h('p,', textarea),
      h('p.post-form-btns',
        h('button.btn.btn-primary', 'Post'),
        ' ',
        h('button.btn.btn-primary.click-preview-text-post', 'Preview'),
        ' ',
        (!!parent) ?
          h('button.btn.btn-primary.click-cancel-reply', { href: '#' }, 'Cancel') : 
          h('button.btn.btn-primary.click-cancel-newpost', { href: '#' }, 'Cancel')
      )
    ),
    h('.closed', h('button.btn.btn-primary.click-newpost', 'Compose'))
  )
}