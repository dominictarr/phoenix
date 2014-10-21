var pull        = require('pull-stream')
var multicb     = require('multicb')
var util        = require('../../../../lib/util')
var wsrpc       = require('../ws-rpc')
var models      = require('../models')

function convertMsgBuffers(msg) {
  msg.previous = new Buffer(msg.previous)
  msg.author = new Buffer(msg.author)
  msg.signature = new Buffer(msg.signature) 
}

// adds a new profile
var addProfile =
exports.addProfile = function(state, p) {
  var pm = state.profileMap()
  var id = util.toHexString(p.id)
  if (id in pm) return state.profiles.get(pm[id])

  // add profile
  var i = state.profiles().length
  p = models.profile(p)
  state.profiles.push(p)

  // add index to the profile map
  pm[id] = i
  state.profileMap.set(pm)

  // add to nickname map
  var nm = state.nicknameMap()
  nm[id] = p.nickname
  state.nicknameMap.set(nm)

  return p
}

// fetches a profile from the backend or cache
var fetchProfileQueue = util.queue()
var fetchProfile =
exports.fetchProfile = function(state, profid, cb) {
  var idStr = util.toHexString(profid)
  var idBuf = util.toBuffer(profid)
  cb = cb || function(){}
  var pm = state.profileMap()

  // load from cache
  var profi = pm[idStr]
  var profile = (typeof profi != 'undefined') ? state.profiles.get(profi) : undefined
  if (profile) return cb(null, profile)

  // try to load from backend
  fetchProfileQueue(idStr, cb, function(cbs) {
    pull(
      wsrpc.api.feedsLinkedTo(idBuf, 'updates-profile'),
      pull.filter(function (link) {
        // filter out messages by other users
        return util.toHexString(link.source) == idStr
      }),
      pull.asyncMap(function(link, cb) {
        wsrpc.api.get(link.message, cb)
      }),
      pull.collect(function(err, msgs) {
        if (err) return cb(err)

        var profile = {
          id: idBuf,
          idStr: idStr,
          nickname: idStr
        }

        // find the most recent profile data
        for (var i = msgs.length - 1; i >= 0; i--) {
          var msg = msgs[i]
          if (msg.value.type == 'profile' && msg.value.nickname) {
            profile.nickname = msg.value.nickname
            break
          }
        }

        // cache the profile
        profile = addProfile(state, profile)

        // pull into current user data
        if (profile.idStr == state.user.idStr())
          state.user.nickname.set(profile.nickname)

        // drain the queue
        cbs(null, profile)
      })
    )
  })
}

// loads the profile's feed (from the backend or cache)
var fetchProfileFeedQueue = util.queue()
var fetchProfileFeed = 
exports.fetchProfileFeed = function(state, profid, cb) {
  var idStr = util.toHexString(profid)
  fetchProfileFeedQueue(idStr, cb, function(cbs) {
    fetchProfile(state, profid, function(err, profile) {
      if (err) return cb(err)
      if (!profile) return cb()
      var done = multicb()

      // fetch feed if not empty :TODO: just see if there are any new
      if (!profile.feed.getLength()) { 
        pull(
          wsrpc.api.createHistoryStream(util.toBuffer(profid), 0),
          pull.drain(function (m) {
            convertMsgBuffers(m)
            m.id = new Buffer('TODO' + m.sequence) // :TODO: replace genMsgId(m)
            m.idStr = util.toHexString(m.id)
            m.authorNickname = profile.nickname
            m = models.message(m)
            if (m.value.type == 'init') profile.joinDate.set(util.prettydate(new Date(m.timestamp), true))
            if (m) profile.feed.push(m)
          }, done())
        )
      }

      // fetch isFollowing state
      if (state.user && state.user.idStr() != idStr) {
        var cb2 = done()
        // :TODO: replace
        wsrpc.api.isFollowing(util.toBuffer(profid), function(err) {
          profile.isFollowing.set(!err)
          cb2()
        })
      }

      // done when ALL done
      done(cbs)
    })
  })
}
