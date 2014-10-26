var pull        = require('pull-stream')
var multicb     = require('multicb')
var util        = require('../../../../lib/util')
var wsrpc       = require('../ws-rpc')
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
  state.feed.unshift(m)
  var mm = state.messageMap()
  mm[m.idStr] = state.feed.getLength() - 1
  state.messageMap.set(mm)

  // add to profile's feed
  if (authorProf) {
    authorProf.feed.push(m)
    if (m.content.type == 'init')
      authorProf.joinDate.set(util.prettydate(new Date(m.timestamp), true))
  }
  
  // index replies
  if (m.content.repliesTo)    indexReplies(state, m)
  if (m.content.rebroadcasts) indexRebroadcasts(state, m, mm)
  if (m.content.mentions)     indexMentions(state, m)
}

function indexReplies(state, msg) {
  try {
    var id = util.toHexString(msg.content.repliesTo.$msg)
    if (id) {
      var sr = state.feedReplies()
      if (!sr[id]) sr[id] = []
      sr[id].push({ idStr: msg.idStr, type: msg.content.type })
      state.feedReplies.set(sr)
    }
  } catch(e) { console.warn('failed to index reply', e) }
}

function indexRebroadcasts(state, msg, msgMap) {
  try {
    var id = util.toHexString(msg.content.rebroadcasts.$msg)
    if (id) {
      var fr = state.feedRebroadcasts()
      if (!fr[id]) fr[id] = []
      fr[id].push({ idStr: msg.idStr })
      state.feedRebroadcasts.set(fr)

      // hide the rebroadcast if the original is already in the feed
      if (msgMap[id]) {
        msg.hidden.set(true)
      } else {
        // use this one to represent the original
        msgMap[id] = state.feed.getLength() - 1
      }
    }
  } catch(e) { console.warn('failed to index rebroadcast', e) }
}

function indexMentions(state, msg) {
  // look for mentions of the current user and create notifications for them
  var fr = state.feedRebroadcasts()
  var mentions = Array.isArray(msg.content.mentions) ? msg.content.mentions : [msg.content.mentions]
  for (var i=0; i < mentions.length; i++) {
    try {
      var mention = mentions[i]
      if (util.toHexString(mention.$feed) != state.user.idStr()) continue // not for current user
      if (msg.content.rebroadcasts && fr[util.toHexString(msg.content.rebroadcasts.$msg)]) continue // already handled
      state.notifications.push(models.notification({
        msgIdStr:       msg.idStr,
        authorNickname: msg.authorNickname,
        msgText:        msg.content.text.split('\n')[0],
        timestamp:      msg.timestamp
      }))
    } catch(e) { console.warn('failed to index mention', e) }
  }
}