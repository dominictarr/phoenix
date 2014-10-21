var util        = require('../../../../lib/util')
var wsrpc       = require('../ws-rpc')

// does pre-processing on text-based messages
var preprocessTextPost =
exports.preprocessTextPost = function(msg) {
  // extract any @-mentions
  var match
  var mentionRegex = /(\s|^)@([A-z0-9]+)/g;
  while ((match = mentionRegex.exec(msg.plain))) {
    var mention = match[2]
    if (!msg.mentions)
      msg.mentions = []
    try {
      msg.mentions.push({ $feed: util.toBuffer(mention), $rel: 'mentions' })
    } catch (e) { /* bad hash, ignore */ }
  }
  return msg
}

// posts to the feed
var publishText =
exports.publishText = function(state, text, cb) {
  if (!text.trim()) return cb(new Error('Can not post an empty string to the feed'))
  wsrpc.api.add(preprocessTextPost({type: 'text', plain: text}), cb)
}

// posts to the feed
var publishReply =
exports.publishReply = function(state, text, parent, cb) {
  parent = util.toBuffer(parent)
  if (!text.trim()) return cb(new Error('Can not post an empty string to the feed'))
  if (!parent) return cb(new Error('Must provide a parent message to the reply'))
  wsrpc.api.add(preprocessTextPost({type: 'text', plain: text, repliesTo: {$msg: parent, $rel: 'replies-to'}}), cb)
}

// posts to the feed
var publishAction =
exports.publishAction = function(state, text, cb) {
  if (!text.trim()) return cb(new Error('Can not post an empty string to the feed'))
  wsrpc.api.add(preprocessTextPost({type: 'act', plain: text}), cb)
}

// posts to the feed
var publishReaction =
exports.publishReaction = function(state, text, parent, cb) {
  parent = util.toBuffer(parent)
  if (!text.trim()) return cb(new Error('Can not post an empty string to the feed'))
  if (!parent) return cb(new Error('Must provide a parent message to the reply'))
  wsrpc.api.add(preprocessTextPost({type: 'act', plain: text, repliesTo: {$msg: parent, $rel: 'replies-to'}}), cb)
}

// posts to the feed
var publishGui =
exports.publishGui = function(state, text, cb) {
  if (!text.trim()) return cb(new Error('Can not post an empty string to the feed'))
  wsrpc.api.add({type: 'gui', html: text}, cb)
}

// posts to the feed
var publishGuiply =
exports.publishGuiply = function(state, text, parent, cb) {
  if (!text.trim()) return cb(new Error('Can not post an empty string to the feed'))
  if (!parent) return cb(new Error('Must provide a parent message to the reply'))
  wsrpc.api.add({type: 'gui', html: text, repliesTo: {$msg: parent, $rel: 'replies-to'}}, cb)
}

// posts a copy of the given message to the feed
var publishRebroadcast =
exports.publishRebroadcast = function(state, msg, cb) {
  if (!msg.content.rebroadcasts) {
    msg.content.rebroadcasts = {
      $rel: 'rebroadcasts',
      $msg: util.toBuffer(msg.id),
      $feed: util.toBuffer(msg.author),
      timestamp: msg.timestamp,
      timezone: msg.timezone
    }
  }
  wsrpc.api.add(msg.content, cb)
}