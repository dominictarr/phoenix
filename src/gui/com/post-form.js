var h = require('hyperscript')

module.exports = function(state) {
  return h('.post-form',
    h('p,', h('textarea.form-control', { rows: 3 })),
    h('p',
      h('button.btn.btn-default', 'Post'),
      ' ',
      h('button.btn.btn-default', 'Preview')
    )
  )
}