module.exports = {
  'post-text': function(state, el, e) {
    var form = (el.tagName == 'FORM') ? el : el.form
    var text = form.text.value
    state.apis.feed.postText(text, function(err) {
      if (err) alert(err.message)
      else {
        form.text.value = ''
        state.sync()
      }
    })
  },
  reply: function(state, el, e) {
    alert('todo')
  },
  react: function(state, el, e) {
    alert('todo')
  },
  'view-userid': function(state, el, e) {
    alert('todo')
  },
  'add-contact': function(state, el, e) {
    alert('todo')
  }
}