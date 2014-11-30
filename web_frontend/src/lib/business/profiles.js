var pull    = require('pull-stream')
var multicb = require('multicb')
var util    = require('../util')
var models  = require('../models')


// consumes a new profile message into the materialized view
exports.processProfileMsg = function(state, msg) {
  console.log('PROFILE consumed', msg)

  var pid = msg.value.author
  
  // lookup/create the profile
  var profile
  var pm = state.profileMap()
  if (pid in pm) {
    profile = state.profiles.get(pm[pid])
  } else {
    // new profile
    var i = state.profiles().length
    profile = { 
      id: pid,
      nickname: pid
    }

    // add to profiles    
    profile = models.profile(profile)
    state.profiles.push(profile)
    
    // add to id->profile map
    pm[pid] = i
    state.profileMap.set(pm)
  }

  try {
    // update values with message content
    if (msg.value.content.nickname) {
      profile.nickname.set(msg.value.content.nickname)

      // update the nickname->profile map
      var nm = state.nicknameMap()
      nm[pid] = profile.nickname()
      state.nicknameMap.set(nm)
    }
  } catch(e) {}

  // pull into current user data
  if (pid == state.user.id())
    state.user.nickname.set(profile.nickname())
}

// fetches a profile from the cache
var getProfile =
exports.getProfile = function(state, pid) {
  var pm = state.profileMap()
  if (pid in pm)
    return state.profiles.get(pm[pid])
  return null
}
