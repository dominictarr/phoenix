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
    var content = msg.value.content

    try {
      if (content.type == 'init')
        profile.createdAt = msg.value.timestamp

      if (content.type == 'name') {
        if (!content.name || !(''+content.name).trim())
          return

        var links = ssbmsgs.getLinks(content, 'names').filter(function(link) { return !!link.feed })
        if (links.length) {
          links.forEach(function(link) {
            var targetProf = getOrCreate(link.feed)
            targetProf.given[pid] = targetProf.given[pid] || {}
            targetProf.given[pid].name = content.name
          })
        } else {
          profile.self.name = content.name
        }
      }
    } catch (e) {
      console.warn('Failed to index message in phoenix-profiles', e, msg)
    }
  }

  function getOrCreate(pid) {
    var profile = profiles[pid]
    if (!profile) {
      profiles[pid] = profile = {
        id: pid,
        self: { name: null },
        given: {},
        createdAt: null
      }
    }
    return profile
  }

  return {
    // new messages sink-stream
    in: function(done) { return pull.drain(process, done) },

    // getters
    get: function(id, cb) {
      if (id in profiles) return cb(null, profiles[id])
      cb(new Error('Not Found'))
    },
    getAll: function(cb) {
      cb(null, profiles)
    },

    // publishers
    nameSelf: function(name, cb) {
      if (typeof name != 'string' || name.trim() == '') return cb(new Error('Arg 1 name string is required and must be non-empty'))
      ssb.add({type: 'name', name: name}, cb)
    },
    nameOther: function(id, name, cb) {
      if (!id || typeof id != 'string') return cb(new Error('Arg 1 target feed id string is required'))
      if (typeof name != 'string' || name.trim() == '') return cb(new Error('Arg 2 name string is required and must be non-empty'))
      ssb.add({type: 'name', rel: 'names', feed: id, name: name}, cb)
    }
  }
}