var util = require('../../lib/util')
var markdown = require('../../lib/markdown')

module.exports = {
  'submit-publish-text-post': function(state, el, e) {
    var form = (el.tagName == 'FORM') ? el : el.form
    var text = form.text.value
    state.apis.feed.postText(text, function(err) {
      if (err) alert(err.message)
      else {
        form.text.value = ''
        var previewEl = form.querySelector('.preview')
        previewEl.innerHTML = ''
        state.sync()
      }
    })
  },
  'click-preview-text-post': function(state, el, e) {
    var form = (el.tagName == 'FORM') ? el : el.form
    var text = form.text.value

    var previewEl = form.querySelector('.preview')
    previewEl.style.display = 'block'
    previewEl.innerHTML = markdown.block(util.escapePlain(text), state.nicknames)
  },
  'click-reply': function(state, el, e) {
    alert('todo')
  },
  'click-react': function(state, el, e) {
    alert('todo')
  },
  'click-view-userid': function(state, el, e) {
    alert('todo')
  },
  'click-add-contact': function(state, el, e) {
    alert('todo')
  }
}