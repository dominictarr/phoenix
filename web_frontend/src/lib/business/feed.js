var pull        = require('pull-stream')
var multicb     = require('multicb')
var util        = require('../../../../lib/util')
var wsrpc       = require('../ws-rpc')
var models      = require('../models')
var profiles    = require('./profiles')

function convertMsgBuffers(msg) {
  msg.previous = new Buffer(msg.previous)
  msg.author = new Buffer(msg.author)
  msg.signature = new Buffer(msg.signature) 
}

// loads the full feed
var fetchFeedQueue = util.queue().bind(null, 'feed')
var fetchFeed =
exports.fetchFeed = function(state, opts, cb) {
  if (!cb && typeof opts == 'function') {
    cb = opts
    opts = 0
  }
  if (!opts) opts = {}

  fetchFeedQueue(cb, function(cbs) {
    // do we have a local cache?
    if (opts.refresh && state.feed.getLength()) {
      state.feed.splice(0, state.feed.getLength()) // clear it out
    }

    // fetch feed stream
    // :TODO: start from where we currently are if there are already messages in the feed
    pull(
      wsrpc.api.createFeedStream(),
      pull.asyncMap(function(m, cb) {
        convertMsgBuffers(m)
        m.id = new Buffer('TODO' + m.sequence) // :TODO: replace genMsgId(m)
        m.idStr = util.toHexString(m.id)

        profiles.fetchProfile(state, m.author, function(err, profile) {
          if (err) console.error('Error loading profile for message', err, m)
          else m.authorNickname = profile.nickname
          cb(null, m)
        })
      }),
      pull.drain(function (m) {
        m = models.message(m)
        if (messageIsCached(state, m)) return // :TODO: remove this once we only pull new messages

        // add to feed
        if (m) state.feed.unshift(m)
        var mm = state.messageMap()
        mm[m.idStr] = state.feed.getLength() - 1
        state.messageMap.set(mm)
        
        // index replies
        if (m.content.repliesTo)    indexReplies(state, m)
        if (m.content.rebroadcasts) indexRebroadcasts(state, m, mm)
        if (m.content.mentions)     indexMentions(state, m)
      }, function() {
        cbs(null, state.feed())
      })
    )
  })
}

// temporary helper to check if we already have the message in our feed cache
function messageIsCached(state, a) {
  if (!a) return false
  for (var i=0; i < state.feed.getLength(); i++) {
    var b = state.feed.get(i)
    if (util.toHexString(a.signature) == util.toHexString(b.signature)) {
      return true
    }
  }
  return false
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
        msgText:        msg.content.plain.split('\n')[0],
        timestamp:      msg.timestamp
      }))
    } catch(e) { console.warn('failed to index mention', e) }
  }
}