
exports.follow = function(state, el, e) {
  var userId = el.dataset.userId
  var isFollowing = (state.user.following.indexOf(userId) != -1)
  if (!isFollowing) {
    state.apis.network.follow(userId, function(err) {
      if (err) alert(err.message)
      else state.sync()
    })
  }
}

exports.unfollow = function(state, el, e) {
  var userId = el.dataset.userId
  var isFollowing = (state.user.following.indexOf(userId) != -1)
  if (isFollowing) {
    state.apis.network.unfollow(userId, function(err) {
      if (err) alert(err.message)
      else state.sync()
    })
  }
}

exports.setNickname = function(state, el, e) {
  var userId = el.dataset.userId || state.user.id
  var isSelf = state.user.id == userId
  var nickname = (isSelf) ?
    prompt('What would you like your nickname to be?') :
    prompt('What would you like their nickname to be?')
  if (!nickname)
    return
  if (!confirm('Set nickname to '+nickname+'?'))
    return
  if (isSelf)
    state.apis.profiles.updateSelf({ nickname: nickname }, done)
  else
    state.apis.profiles.giveNick(userId, nickname, done)
  function done(err) {
    if (err) alert(err.message)
    else state.sync()
  }
}