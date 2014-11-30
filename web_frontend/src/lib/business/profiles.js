var pull    = require('pull-stream')
var multicb = require('multicb')
var util    = require('../util')
var models  = require('../models')


// consumes a new profile message into the materialized view
exports.processProfileMsg = function(state, msg) {
  console.log('PROFILE consumed', msg)

  var pid = msg.value.author
  var pidStr = util.toHexString(pid)
  
  // lookup/create the profile
  var profile
  var pm = state.profileMap()
  if (pidStr in pm) {
    profile = state.profiles.get(pm[pidStr])
  } else {
    // new profile
    var i = state.profiles().length
    profile = { 
      id: pid,
      idStr: pidStr,
      nickname: pidStr
    }

    // add to profiles    
    profile = models.profile(profile)
    state.profiles.push(profile)
    
    // add to id->profile map
    pm[pidStr] = i
    state.profileMap.set(pm)
  }

  try {
    // update values with message content
    if (msg.value.content.nickname) {
      profile.nickname.set(msg.value.content.nickname)

      // update the nickname->profile map
      var nm = state.nicknameMap()
      nm[pidStr] = profile.nickname()
      state.nicknameMap.set(nm)
    }
  } catch(e) {}

  // pull into current user data
  if (pidStr == state.user.idStr())
    state.user.nickname.set(profile.nickname())
}

// fetches a profile from the cache
var getProfile =
exports.getProfile = function(state, pid) {
  var pidStr = (typeof pid == 'string') ? pid : util.toHexString(pid)

  var pm = state.profileMap()
  if (pidStr in pm)
    return state.profiles.get(pm[pidStr])
  return null
}
