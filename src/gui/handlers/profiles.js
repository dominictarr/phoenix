
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