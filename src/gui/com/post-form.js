var h = require('hyperscript')

module.exports = function(state, parent) {
  return h('form.post-form.submit-publish-text-post' + ((!!parent) ? '.reply-form' : ''), { 'data-parent': parent },
    h('p.preview'),
    h('p,', h('textarea.form-control', { name: 'text', rows: 3 })),
    h('p.post-form-btns',
      h('button.btn.btn-default', 'Post'),
      ' ',
      h('button.btn.btn-default.click-preview-text-post', 'Preview'),
      ' ',
      (!!parent) ? h('a.click-cancel-reply', { href: '#' }, 'Cancel') : ''
    )
  )
}