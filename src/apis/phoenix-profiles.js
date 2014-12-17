var pull = require('pull-stream')
var ssbmsgs = require('ssb-msgs')

module.exports = {
  name: 'phoenix-profiles',
  version: '0.0.0',
  permissions: {
    // anonymous: {allow: ['has', 'get']}, :TODO:
  }
}

module.exports.init = function(ssb) {
  var profiles = {}

  // handle received messages
  function process(msg) {
    var pid = msg.value.author
    var profile = getOrCreate(pid)

    // index
    var content = msg.value.content
    if (content.type == 'init')
      profile.createdAt = msg.value.timestamp
    if (content.type == 'profile') {
      // only handle more recent than current
      if (profile.msgSeq < msg.value.seq) {
        profile.msgSeq = msg.value.seq
        if (content.nickname)
          profile.nickname = content.nickname
      }
    }
    ssbmsgs.indexLinks(content, function(link) {
      if (link.rel == 'gives-nick') indexGivesNick(msg, link)
    })
  }

  function getOrCreate(pid) {
    var profile = profiles[pid]
    if (!profile) {
      profiles[pid] = profile = {
        id: pid,
        msgSeq: null,
        nickname: null,
        given: [],
        createdAt: null
      }
    }
    return profile
  }

  function indexGivesNick(msg, link) {
    try {
      var targetProf = profiles[link.feed]
      if (!targetProf || !link.nickname)
        return
      targetProf.given.push({ nickname: link.nickname, author: msg.value.author })
    } catch (e) { console.warn('failed to index gives-nick', msg, e)}
  }

  return {
    // new messages sink-stream
    in: function(done) { return pull.drain(process, done) },

    // output streams
    all: function() { return pull.values(allFeed) },

    // getters
    get: function(id, cb) {
      if (id in profiles) return cb(null, profiles[id])
      cb(new Error('Not Found'))
    },

    // publishers
    updateSelf: function(profile, cb) {
      if (!profile || typeof profile != 'object') return cb(new Error('Profile object is required'))
      if (typeof profile.nickname != 'string' || profile.nickname.trim() == '') return cb(new Error('`profile.nickname` string is required and must be non-empty'))
      ssb.add({type: 'profile', nickname: profile.nickname}, cb)
    },
    giveNick: function(id, nickname, cb) {
      if (!id || typeof id != 'string') return cb(new Error('Target user id is required'))
      if (typeof nickname != 'string' || nickname.trim() == '') return cb(new Error('Nickname string is required and must be non-empty'))
      ssb.add({type: 'gives-nick', rel: 'gives-nick', feed: id, nickname: nickname}, cb)
    }
  }
}