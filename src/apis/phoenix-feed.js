var pull = require('pull-stream')
var ssbmsgs = require('ssb-msgs')

module.exports = {
  name: 'phoenix-feed',
  version: '0.0.0',
  permissions: {
    // anonymous: {allow: ['has', 'get']}, :TODO:
  }
}

module.exports.init = function(ssb) {
  var msgs = {}
  var replies = {}
  var allFeed = []
  var inboxFeed = []
  var userFeeds = {}

  // :TODO: it would be best if there was no `userId`
  // `userId` is used to contruct the inbox. It would be wasteful to do it for every user
  // but it's a pain to have just one `userId`, because there may be multiple users that we need the inbox for
  // it would be better to just construct (and continue tracking) the inbox for a user when it's requested
  var userId = null

  // setup
  ssb.whoami(function(err, user) {
    if (user)
      userId = user.id
  })

  // handle received messages
  function process(msg) {
    if (msg.key in msgs)
      return // already indexed

    // index
    msgs[msg.key] = msg
    allFeed.push(msg)
    (userFeeds[msg.value.author] = (userFeeds[msg.value.author]||[])).push(msg)
    ssbmsgs.indexLinks(msg.value.content, function(link) {
      if (link.rel == 'rebroadcasts') indexRebroadcast(msg, link)
      if (link.rel == 'replies-to')   indexReply(msg, link)
      if (link.rel == 'mentions')     indexMentions(msg, link)
    })
  }

  function indexRebroadcast(msg, link) {
    try {
      if (!link.msg) return
      if (msg.isInboxed) return
      msg.isRebroadcast = true
    } catch(e) { console.warn('failed to index rebroadcast', msg, e) }
  }

  function indexReply(msg, link) {
    try {
      if (!link.msg) return
      if (msg.isInboxed) return
      (replies[link.msg] = (replies[link.msg]||[])).push(msg)
      msg.repliesToLink = link

      // add to inbox if it's a reply to the user's message
      var target = msgs[link.msg]
      if (target && target.value.author == userId && msg.value.author != userId) {
        inboxFeed.push(msg)
        msg.isInboxed = true
      }
    } catch(e) { console.warn('failed to index reply', msg, e) }
    return false
  }

  function indexMentions(state, msg, link) {
    try {
      if (msg.isInboxed) return // already handled
      if (link.feed != userId) return // not for current user
      inboxFeed.push(msg)
      msg.isInboxed = true
    } catch(e) { console.warn('failed to index mention', msg, e) }
  }

  // publish a post
  function post(msg, cb) {
    // extract any @-mentions
    var match
    var mentionRegex = /(\s|^)@([A-z0-9\/=\.\+]+)/g;
    while ((match = mentionRegex.exec(msg.text))) {
      var mention = match[2]
      if (!msg.mentions)
        msg.mentions = []
      try {
        msg.mentions.push({ feed: mention, rel: 'mentions' })
      } catch (e) { /* :TODO: bad hash, tell user? */ console.warn('Invalid hash used in @-mention', mention) }
    }
    ssb.add(msg, cb)
  }

  return {
    // new messages sink-stream
    in: function(done) { return pull.drain(process, done) },

    // output streams
    all: function() { return pull.values(allFeed) },
    inbox: function() { return pull.values(inboxFeed) },
    user: function(id) { return pull.values(userFeeds[id]) },

    // getters
    get: function(id, cb) {
      if (id in msgs) return cb(null, msgs[id])
      cb(new Error('Not Found'))
    },
    getReplies: function(id, cb) {
      if (id in msgs) return cb(null, replies[id]||[])
      cb(new Error('Not Found'))
    },

    // posts to the feed
    postText: function(text, cb) {
      if (!text.trim()) return cb(new Error('Can not post an empty string to the feed'))
      post({type: 'post', postType: 'text', text: text}, cb)
    },

    // posts to the feed
    postReply: function(text, parent, cb) {
      if (!text.trim()) return cb(new Error('Can not post an empty string to the feed'))
      if (!parent) return cb(new Error('Must provide a parent message to the reply'))
      post({type: 'post', postType: 'text', text: text, repliesTo: {msg: parent, rel: 'replies-to'}}, cb)
    },

    // posts to the feed
    postAction: function(text, cb) {
      if (!text.trim()) return cb(new Error('Can not post an empty string to the feed'))
      post({type: 'post', postType: 'action', text: text}, cb)
    },

    // posts to the feed
    postReaction: function(text, parent, cb) {
      if (!text.trim()) return cb(new Error('Can not post an empty string to the feed'))
      if (!parent) return cb(new Error('Must provide a parent message to the reply'))
      post({type: 'post', postType: 'action', text: text, repliesTo: {msg: parent, rel: 'replies-to'}}, cb)
    },

    // posts a copy of the given message to the feedn
    rebroadcast: function(msg, cb) {
      var content = JSON.parse(JSON.stringify(msg.value.content))
      if (!content.rebroadcasts) {
        content.rebroadcasts = {
          rel: 'rebroadcasts',
          msg: msg.key,
          feed: msg.value.author,
          timestamp: msg.value.timestamp
        }
      }
      ssb.add(content, cb)
    }
  }
}