module.exports = {
  'submit-publish-text-post': require('./textpost').submit,
  'click-preview-text-post': require('./textpost').preview,
  'click-reply': require('./textpost').reply,
  'click-cancel-reply': require('./textpost').cancelReply,
  'click-react': function(state, el, e) {
    var text = prompt('What is your reaction? eg "likes", "agrees with"')
    if (!text)
      return

    state.apis.feed.postReaction(text, el.dataset.msgid, function(err) {
      if (err) alert(err.message)
      else state.sync()
    })
  },
  'click-header-menu': require('./header-menu').toggle,
  'click-set-render-mode': require('./header-menu').setRenderMode,
  'click-set-feed-mode': require('./header-menu').setFeedMode,
  'click-follow': require('./profiles').follow,
  'click-unfollow': require('./profiles').unfollow,
  'click-view-userid': function(state, el, e) {
    prompt('Here is your contact id', state.user.id)
  },
  'click-add-contact': function(state, el, e) {
    alert('todo')
  }
}