var h = require('hyperscript')
var suggestBox = require('suggest-box')
var textpostHandlers = require('../handlers/textpost')

module.exports = function(state, parent) {
  var textarea = h('textarea.form-control', { name: 'text', rows: 6 })
  suggestBox(textarea, state.suggestOptions) // decorate with suggestbox 
  textarea.onblur = function(e) {
    textpostHandlers.preview(state, textarea, e)
  }

  return h('form.post-form.submit-publish-text-post' + ((!!parent) ? '.reply-form' : ''), { 'data-parent': parent },
    h('p', textarea),
    h('p.post-form-btns',
      h('button.btn.btn-primary.pull-right', 'Post'),
      (!!parent) ?
        h('button.btn.btn-primary.click-cancel-reply', { href: '#' }, 'Cancel') : 
        h('button.btn.btn-primary.click-navigate', { href: '#/' }, 'Cancel')
    ),
    h('.preview-wrapper.panel.panel-default',
      h('.panel-heading', h('small', 'Preview:')),
      h('.panel-body', h('.preview'))
    )
  )
}