module.exports = {
  'click-navigate': function(state, el) { window.location = el.href },
  'click-sync': function(state) { state.sync() },
  'submit-publish-text-post': require('./textpost').submit,
  'click-preview-text-post': require('./textpost').preview,
  'submit-publish-advert-post': require('./adpost').submit,
  'click-preview-advert-post': require('./adpost').preview,
  'click-newpost': require('./textpost').newpost,
  'click-cancel-newpost': require('./textpost').cancelNewpost,
  'click-reply': require('./textpost').reply,
  'click-cancel-reply': require('./textpost').cancelReply,
  'click-newadvert': require('./adpost').newad,
  'click-cancel-advert': require('./adpost').cancelAdvert,
  'click-react': function(state, el, e) {
    var text = prompt('What is your reaction? eg "likes", "agrees with"')
    if (!text)
      return

    state.apis.feed.postReaction(text, el.dataset.msgid, function(err) {
      if (err) swal('Error While Publishing', err.message, 'error')
      else state.sync()
    })
  },
  'click-header-menu': require('./header-menu').toggle,
  'click-set-render-mode': require('./header-menu').setRenderMode,
  'click-set-feed-mode': require('./header-menu').setFeedMode,
  'click-follow': require('./profiles').follow,
  'click-unfollow': require('./profiles').unfollow,
  'click-set-name': require('./profiles').setName,
  'click-view-userid': function(state, el, e) {
    swal('Here is your contact id', state.user.id)
  },
  'click-add-contact': require('./profiles').followPrompt
}