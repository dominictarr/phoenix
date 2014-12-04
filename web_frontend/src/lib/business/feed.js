var pull        = require('pull-stream')
var multicb     = require('multicb')
var mlib        = require('ssb-msgs')
var util        = require('../util')
var models      = require('../models')
var profiles    = require('./profiles')

exports.processFeedMsg = function(state, msg) {
  console.log('FEED consumed', msg)
  
  // prep message  
  var m = msg.value
  m.id             = msg.key
  var authorProf   = profiles.getProfile(state, m.author)
  m.authorNickname = (authorProf) ? authorProf.nickname() : require('../common-render').shortString(m.author)
  m = models.message(m)

  // add to feed
  state.feedView.messages.unshift(m)
  var mm = state.feedView.messageMap()
  mm[m.id] = state.feedView.messages.getLength() - 1
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
    if (link.$rel == 'adds-status')  indexAddStatus(state, m, link)
  })
}

function indexFollow(state, msg, link) {
  try {
    if (msg.author == state.user.id()) {
      // add to list
      state.user.followedUsers.push(link.$feed)

      // update profile if present
      var targetProf = profiles.getProfile(state, link.$feed)
      if (targetProf)
        targetProf.isFollowing.set(true)
    }
    if (link.$feed == state.user.id()) {
      // add to list
      state.user.followerUsers.push(msg.author)
    }
  } catch(e) { console.warn('failed to index follow', e) }
}

function indexUnfollow(state, msg, link) {
  try {
    if (msg.author == state.user.id()) {
      // remove from list
      state.user.followedUsers.splice(state.user.followedUsers.indexOf(link.$feed), 1)

      // update profile if present
      var targetProf = profiles.getProfile(state, link.$feed)
      if (targetProf)
        targetProf.isFollowing.set(false)
    }
    if (link.$feed == state.user.id()) {
      // remove from list
      state.user.followerUsers.splice(state.followerUsers.indexOf(msg.author), 1)
    }
  } catch(e) { console.warn('failed to index follow', e) }
}

function indexReply(state, msg, link) {
  try {
    if (!link.$msg)
      return false

    // index the reply
    var fr = state.feedView.replies()
    if (!fr[link.$msg]) fr[link.$msg] = []
    fr[link.$msg].push({ id: msg.id, type: msg.content.type })
    state.feedView.replies.set(fr)

    // put this link in a consistent place on the msssage
    msg.repliesToLink.set(link)

    // add a notification if it's a reply to the user's message
    var mm = state.feedView.messageMap()
    var targetMsg = state.feedView.messages.get(state.feedView.messages.getLength() - mm[link.$msg] - 1)
    if (targetMsg && targetMsg.author == state.user.id()) {
      var type = 'reply'
      if (msg.content.postType == 'action') type = 'reaction'
      state.notifications.push(models.notification({
        type:           type,
        msgId:          msg.id,
        authorNickname: msg.authorNickname,
        msgText:        msg.content.text.split('\n')[0],
        timestamp:      msg.timestamp
      }))
      return true
    }
  } catch(e) { console.warn('failed to index reply', e) }
  return false
}

function indexRebroadcast(state, msg, link, msgMap) {
  try {
    if (!link.$msg)
      return

    var fr = state.feedView.rebroadcasts()
    if (!fr[link.$msg]) fr[link.$msg] = []
    fr[link.$msg].push({ id: msg.id })
    state.feedView.rebroadcasts.set(fr)

    // put this link in a consistent place on the msssage
    msg.rebroadcastsLink.set(link)

    // hide the rebroadcast if the original is already in the feed
    if (msgMap[link.$msg]) {
      msg.hidden.set(true)
    } else {
      // use this one to represent the original
      msgMap[link.$msg] = state.feedView.messages.getLength() - 1
    }
  } catch(e) { console.warn('failed to index rebroadcast', e) }
}

function indexMentions(state, msg, link) {
  // look for mentions of the current user and create notifications for them
  var fr = state.feedView.rebroadcasts()
  try {
    if (link.$feed != state.user.id()) return // not for current user
    if (msg.rebroadcastsLink && fr[msg.rebroadcastsLink.$msg]) return // already handled
    state.notifications.push(models.notification({
      type:          'mention',
      msgId:          msg.id,
      authorNickname: msg.authorNickname,
      msgText:        msg.content.text.split('\n')[0],
      timestamp:      msg.timestamp
    }))
  } catch(e) { console.warn('failed to index mention', e) }
}

function indexAddStatus(state, msg, link) {
  try {    
    // update profile if present
    var targetProf = profiles.getProfile(state, link.$feed)
    if (targetProf) {
      var endsAt
      if (!link.text)
        throw "adds-status link requires a 'text' field"
      if (link.duration) {
        endsAt = msg.timestamp + link.duration
        if (Date.now() > endsAt)
          return
      }
      targetProf.statuses.push({
        msg:       msg.id,
        author:    msg.author,
        text:      link.text,
        textColor: link.textColor,
        endsAt:    endsAt
      })
    }
    
  } catch(e) { console.warn('failed to index adds-status', e) }
}