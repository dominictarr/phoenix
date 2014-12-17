var h = require('hyperscript')

module.exports = function(state) {
  return h('form.post-form.submit-publish-text-post',
    h('p.preview'),
    h('p,', h('textarea.form-control', { name: 'text', rows: 3 })),
    h('p',
      h('button.btn.btn-default', 'Post'),
      ' ',
      h('button.btn.btn-default.click-preview-text-post', 'Preview')
    )
  )
}