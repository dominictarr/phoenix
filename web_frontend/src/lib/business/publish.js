var util = require('../util')
var ws   = require('../ws-rpc')

var localTZ = new Date().getTimezoneOffset();

// does pre-processing on text-based messages
var preprocessPost =
exports.preprocessPost = function(msg) {
  // extract any @-mentions
  var match
  var mentionRegex = /(\s|^)@([A-z0-9]+)/g;
  while ((match = mentionRegex.exec(msg.text))) {
    var mention = match[2]
    if (!msg.mentions)
      msg.mentions = []
    try {
      msg.mentions.push({ $feed: mention, $rel: 'mentions' })
    } catch (e) { /* :TODO: bad hash, tell user? */ console.warn('Invalid hash used in @-mention', mention) }
  }
  return msg
}

// posts to the feed
var publishText =
exports.publishText = function(state, text, cb) {
  if (!text.trim()) return cb(new Error('Can not post an empty string to the feed'))
  ws.api.add(preprocessPost({type: 'post', postType: 'text', text: text, timezone: localTZ}), cb)
}

// posts to the feed
var publishReply =
exports.publishReply = function(state, text, parent, cb) {
  if (!text.trim()) return cb(new Error('Can not post an empty string to the feed'))
  if (!parent) return cb(new Error('Must provide a parent message to the reply'))
  ws.api.add(preprocessPost({type: 'post', postType: 'text', text: text, timezone: localTZ, repliesTo: {$msg: parent, $rel: 'replies-to'}}), cb)
}

// posts to the feed
var publishAction =
exports.publishAction = function(state, text, cb) {
  if (!text.trim()) return cb(new Error('Can not post an empty string to the feed'))
  ws.api.add(preprocessPost({type: 'post', postType: 'action', text: text, timezone: localTZ}), cb)
}

// posts to the feed
var publishReaction =
exports.publishReaction = function(state, text, parent, cb) {
  if (!text.trim()) return cb(new Error('Can not post an empty string to the feed'))
  if (!parent) return cb(new Error('Must provide a parent message to the reply'))
  ws.api.add(preprocessPost({type: 'post', postType: 'action', text: text, timezone: localTZ, repliesTo: {$msg: parent, $rel: 'replies-to'}}), cb)
}

// posts to the feed
var publishGui =
exports.publishGui = function(state, text, cb) {
  if (!text.trim()) return cb(new Error('Can not post an empty string to the feed'))
  ws.api.add({type: 'post', postType: 'gui', text: text, timezone: localTZ}, cb)
}

// posts to the feed
var publishGuiply =
exports.publishGuiply = function(state, text, parent, cb) {
  if (!text.trim()) return cb(new Error('Can not post an empty string to the feed'))
  if (!parent) return cb(new Error('Must provide a parent message to the reply'))
  ws.api.add({type: 'post', postType: 'gui', text: text, timezone: localTZ, repliesTo: {$msg: parent, $rel: 'replies-to'}}, cb)
}

// posts a copy of the given message to the feed
var publishRebroadcast =
exports.publishRebroadcast = function(state, msg, cb) {
  if (!msg.content.rebroadcasts) {
    msg.content.rebroadcasts = {
      $rel: 'rebroadcasts',
      $msg: msg.id,
      $feed: msg.author,
      timestamp: msg.timestamp,
      timezone: msg.content.timezone || 0
    }
  }
  ws.api.add(msg.content, cb)
}

// updates the user's profile
var publishText =
exports.publishProfile = function(state, nickname, cb) {
  ws.api.add({type: 'profile', nickname: nickname}, cb)
}