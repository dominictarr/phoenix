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
  var allFeed = []
  var inboxFeeds = {}
  var adverts = []

  // handle received messages
  function process(msg) {
    if (msg.key in msgs)
      return // already indexed

    // prep message
    msg.inboxes = {}
    msg.replies = []

    // index
    msgs[msg.key] = msg
    allFeed.push(msg)
    if (msg.value.content.type == 'advert' && !!msg.value.content.text)
      adverts.push(msg.key)
    ssbmsgs.indexLinks(msg.value.content, function(link) {
      if (link.rel == 'replies-to')   indexReply(msg, link)
      if (link.rel == 'mentions')     indexMentions(msg, link)
    })

    // render message
    msg.markdown = toMarkdown(msg)
  }

  function indexReply(msg, link) {
    try {
      if (!link.msg) return
      var parent = msgs[link.msg]
      if (!parent) return
      parent.replies.push(msg.key)
      msg.repliesToLink = link

      // add to inbox if it's a reply to an inbox user's message
      var target = msgs[link.msg]
      var recp = target.value.author
      if (target && recp in inboxFeeds && msg.value.author != recp && !msg.inboxes[recp]) {
        inboxFeeds[recp].push(msg.key)        
        msg.inboxes[recp] = true
      }
    } catch(e) { console.warn('failed to index reply', msg, e) }
    return false
  }

  function indexMentions(msg, link) {
    try {
      if (msg.inboxes[link.feed]) return // already handled
      if (link.feed in inboxFeeds) {
        inboxFeeds[link.feed].push(msg.key)
        msg.inboxes[link.feed] = true
      }
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
    addInboxIndex: function(id, cb) {
      if (!inboxFeeds[id])
        inboxFeeds[id] = []
      cb&&cb()
    },
    delInboxIndex: function(id, cb) {
      delete inboxFeeds[id]
      cb&&cb()
    },

    // new messages sink-stream
    in: function(done) { return pull.drain(process, done) },

    // output streams
    all: function() { return pull.values(allFeed) },
    inbox: function(id) { return pull.values(inboxFeeds[id]||[]) },
    adverts: function() { return pull.values(adverts) },

    // getters
    get: function(id, cb) {
      if (id in msgs) return cb(null, msgs[id])
      cb(new Error('Not Found'))
    },
    getReplies: function(id, cb) {
      if (id in msgs) {
        msg = msgs[id]
        var replies = msg.replies.map(function(id) { return msgs[id] })
        return cb(null, replies)
      }
      cb(new Error('Not Found'))
    },

    // publishers
    postText: function(text, cb) {
      if (!text.trim()) return cb(new Error('Can not post an empty string to the feed'))
      post({type: 'post', text: text}, cb)
    },
    postReply: function(text, parent, cb) {
      if (!text.trim()) return cb(new Error('Can not post an empty string to the feed'))
      if (!parent) return cb(new Error('Must provide a parent message to the reply'))
      post({type: 'post', text: text, repliesTo: {msg: parent, rel: 'replies-to'}}, cb)
    },
    postAdvert: function(text, cb) {
      if (!text.trim()) return cb(new Error('Can not post an empty string to the adverts'))
      post({type: 'advert', text: text}, cb)      
    }
  }
}

function toMarkdown(msg) {
  try {
    var content = msg.value.content
    if (content.type == 'post' && content.text)
      return content.text
    if (content.type == 'advert' && content.text)
      return content.text
  } catch (e) {}
  return null
}