var pull        = require('pull-stream')
var multicb     = require('multicb')
var mlib        = require('ssb-msgs')
var util        = require('../../../../lib/util')
var models      = require('../models')
var profiles    = require('./profiles')

exports.processFeedMsg = function(state, msg) {
  console.log('FEED consumed', msg)
  
  // prep message  
  var m = msg.value
  m.id             = new Buffer(msg.key)
  m.idStr          = util.toHexString(m.id)
  m.previous       = new Buffer(m.previous)
  m.author         = new Buffer(m.author)
  m.signature      = new Buffer(m.signature) 
  var authorProf   = profiles.getProfile(state, m.author)
  m.authorNickname = (authorProf) ? authorProf.nickname() : util.toHexString(m.author)
  m = models.message(m)

  // add to feed
  state.feedView.messages.unshift(m)
  var mm = state.feedView.messageMap()
  mm[m.idStr] = state.feedView.messages.getLength() - 1
  state.feedView.messageMap.set(mm)

  // add to profile's feed
  if (authorProf) {
    authorProf.feed.push(m)
    if (m.content.type == 'init')
      authorProf.joinDate.set(util.prettydate(new Date(m.timestamp), true))
  }
  
  // additional indexing
  var notified = false
  mlib.indexLinks(m.content, function(link) {
    if (link.$rel == 'follows')      indexFollow(state, m, link)
    if (link.$rel == 'unfollows')    indexUnfollow(state, m, link)
    if (link.$rel == 'rebroadcasts') indexRebroadcast(state, m, link, mm)
    if (link.$rel == 'replies-to')   notified = indexReply(state, m, link)
    if (!notified &&
        link.$rel == 'mentions')     indexMentions(state, m, link)
  })
}

function indexFollow(state, msg, link) {
  try {
    var authorIdStr = util.toHexString(msg.author)
    var targetIdStr = util.toHexString(link.$feed)
    if (authorIdStr == state.user.idStr()) {
      // add to list
      state.followedUsers.push(targetIdStr)

      // update profile if present
      var targetProf = profiles.getProfile(state, targetIdStr)
      if (targetProf)
        targetProf.isFollowing.set(true)
    }
    if (targetIdStr == state.user.idStr()) {
      // add to list
      state.followerUsers.push(authorIdStr)
    }
  } catch(e) { console.warn('failed to index follow', e) }
}

function indexUnfollow(state, msg, link) {
  try {
    var authorIdStr = util.toHexString(msg.author)
    var targetIdStr = util.toHexString(link.$feed)
    if (authorIdStr == state.user.idStr()) {
      // remove from list
      state.followedUsers.splice(state.followedUsers.indexOf(targetIdStr), 1)

      // update profile if present
      var targetProf = profiles.getProfile(state, targetIdStr)
      if (targetProf)
        targetProf.isFollowing.set(false)
    }
    if (targetIdStr == state.user.idStr()) {
      // remove from list
      state.followerUsers.splice(state.followerUsers.indexOf(authorIdStr), 1)
    }
  } catch(e) { console.warn('failed to index follow', e) }
}

function indexReply(state, msg, link) {
  try {
    var id = util.toHexString(link.$msg)
    if (id) {
      // index the reply
      var fr = state.feedView.replies()
      if (!fr[id]) fr[id] = []
      fr[id].push({ idStr: msg.idStr, type: msg.content.type })
      state.feedView.replies.set(fr)

      // put this link in a consistent place on the msssage
      msg.repliesToLink.set(link)

      // add a notification if it's a reply to the user's message
      var mm = state.feedView.messageMap()
      var targetMsg = state.feedView.messages.get(state.feedView.messages.getLength() - mm[id] - 1)
      if (targetMsg && targetMsg.authorStr == state.user.idStr()) {
        var type = 'reply'
        if (msg.content.postType == 'action') type = 'reaction'
        state.notifications.push(models.notification({
          type:           type,
          msgIdStr:       msg.idStr,
          authorNickname: msg.authorNickname,
          msgText:        msg.content.text.split('\n')[0],
          timestamp:      msg.timestamp
        }))
        return true
      }
    }
  } catch(e) { console.warn('failed to index reply', e) }
  return false
}

function indexRebroadcast(state, msg, link, msgMap) {
  try {
    var id = util.toHexString(link.$msg)
    if (id) {
      var fr = state.feedView.rebroadcasts()
      if (!fr[id]) fr[id] = []
      fr[id].push({ idStr: msg.idStr })
      state.feedView.rebroadcasts.set(fr)

      // put this link in a consistent place on the msssage
      msg.rebroadcastsLink.set(link)

      // hide the rebroadcast if the original is already in the feed
      if (msgMap[id]) {
        msg.hidden.set(true)
      } else {
        // use this one to represent the original
        msgMap[id] = state.feedView.messages.getLength() - 1
      }
    }
  } catch(e) { console.warn('failed to index rebroadcast', e) }
}

function indexMentions(state, msg, link) {
  // look for mentions of the current user and create notifications for them
  var fr = state.feedView.rebroadcasts()
  try {
    if (util.toHexString(link.$feed) != state.user.idStr()) return // not for current user
    if (msg.rebroadcastsLink && fr[util.toHexString(msg.rebroadcastsLink.$msg)]) return // already handled
    state.notifications.push(models.notification({
      type:          'mention',
      msgIdStr:       msg.idStr,
      authorNickname: msg.authorNickname,
      msgText:        msg.content.text.split('\n')[0],
      timestamp:      msg.timestamp
    }))
  } catch(e) { console.warn('failed to index mention', e) }
}