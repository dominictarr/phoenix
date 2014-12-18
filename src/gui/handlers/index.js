var util = require('../../lib/util')
var markdown = require('../../lib/markdown')
var com = require('../com')

module.exports = {
  'submit-publish-text-post': function(state, el, e) {
    var form = (el.tagName == 'FORM') ? el : el.form
    var text = form.text.value
    var parent = form.dataset.parent

    if (parent) state.apis.feed.postReply(text, parent, done)
    else state.apis.feed.postText(text, done)
    function done(err) {
      if (err) alert(err.message)
      else {
        form.text.value = ''
        var previewEl = form.querySelector('.preview')
        previewEl.innerHTML = ''
        state.sync()
      }
    }
  },
  'click-preview-text-post': function(state, el, e) {
    var form = (el.tagName == 'FORM') ? el : el.form
    var text = form.text.value

    var previewEl = form.querySelector('.preview')
    previewEl.style.display = 'block'
    previewEl.innerHTML = markdown.block(util.escapePlain(text), state.nicknames)
  },
  'click-reply': function(state, el, e) {
    var messageEl = el.parentNode.parentNode.parentNode
    if (!messageEl.nextSibling || !messageEl.nextSibling.classList.contains('reply-form')) {
      var formEl = com.postForm(state, el.dataset.msgid)
      if (messageEl.nextSibling)
        messageEl.parentNode.insertBefore(formEl, messageEl.nextSibling)
      else
        messageEl.parentNode.appendChild(formEl)
    }
  },
  'click-cancel-reply': function(state, el, e) {
    var replyFormEl = el.parentNode.parentNode
    replyFormEl.parentNode.removeChild(replyFormEl)
  },
  'click-react': function(state, el, e) {
    var text = prompt('What is your reaction? eg "likes", "agrees with"')
    if (!text)
      return

    state.apis.feed.postReaction(text, el.dataset.msgid, function(err) {
      if (err) alert(err.message)
      else state.sync()
    })
  },
  'click-view-userid': function(state, el, e) {
    alert('todo')
  },
  'click-add-contact': function(state, el, e) {
    alert('todo')
  }
}