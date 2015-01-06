module.exports = {
  'click-navigate': function(state, el) { window.location = el.href },
  'click-sync': function(state) { state.sync() },
  'submit-publish-text-post': require('./textpost').submit,
  'click-preview-text-post': require('./textpost').preview,
  'click-reply': require('./textpost').reply,
  'click-cancel-reply': require('./textpost').cancelReply,
  'click-react': function(state, el, e) {
    var text = prompt('What is your reaction? eg "likes", "agrees with"')
    if (!text)
      return

    state.apis.feed.postReaction(text, el.dataset.msgid, function(err) {
      if (err) swal('Error While Publishing', err.message, 'error')
      else state.sync()
    })
  },
  'click-follow': require('./profiles').follow,
  'click-unfollow': require('./profiles').unfollow,
  'click-set-name': require('./profiles').setName,
  'click-view-userid': function(state, el, e) {
    swal('Here is your contact id', state.user.id)
  },
  'click-add-contact': require('./profiles').followPrompt
}