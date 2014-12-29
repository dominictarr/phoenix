
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

exports.followPrompt = function(state, el, e) {
  var id = prompt('Enter the user id or invite code for who you want to follow')
  if (!id)
    return
  var parts = id.split(',')
  var isInvite = (parts.length === 3)
  if (isInvite) state.apis.ssb.invite.addMe(id, next)
  else state.apis.network.follow(id, next)
  function next (err) {
    if (err) {
      console.error(err)
      alert('Error: '+err.message)
    }
    else {
      if (isInvite)
        alert('Invite code accepted')
      else
        alert('Now following '+id)
      state.sync()
    }
  }
}

exports.setName = function(state, el, e) {
  var userId = el.dataset.userId || state.user.id
  var isSelf = state.user.id == userId
  var name = (isSelf) ?
    prompt('What would you like your nickname to be?') :
    prompt('What would you like their nickname to be?')
  if (!name)
    return
  if (!confirm('Set nickname to '+name+'?'))
    return
  if (isSelf)
    state.apis.profiles.nameSelf(name, done)
  else
    state.apis.profiles.nameOther(userId, name, done)
  function done(err) {
    if (err) alert(err.message)
    else state.sync()
  }
}