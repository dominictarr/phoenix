var pull = require('pull-stream')
var ssbmsgs = require('ssb-msgs')

module.exports = {
  name: 'phoenix-network',
  version: '0.0.0',
  permissions: {
    // anonymous: {allow: ['has', 'get']}, :TODO:
  }
}

module.exports.init = function(ssb) {
  var followers = {}
  var following = {}
  var pubPeers = []
  var localPeers = []

  // handle received messages
  function process(msg) {
    // index
    if (msg.value.content.type == 'pub') indexPub(msg)
    ssbmsgs.indexLinks(msg.value.content, function(link) {
      if (link.rel == 'follows')   indexFollow(msg, link)
      if (link.rel == 'unfollows') indexUnfollow(msg, link)
    })
  }

  function indexPub(msg) {
    try {
      var addr = msg.value.content.address
      if (typeof addr == 'string') {
        addr = addr.split(':')
        addr = { host: addr[0], port: addr[1]||2000 }
      }
      var exists = pubPeers.filter(function(addr2) { return addr2.host == addr.host && (addr2.port||2000) == addr.port }).length
      if (!exists)
        pubPeers.push({ host: addr.host, port: addr.port || 2000 })
    } catch (e) { console.warn('failed to index pub message', m, e) }
  }

  function indexFollow(msg, link) {
    try {
      var src = msg.value.author
      var dst = link.feed
      followers[dst] = followers[dst]||[]
      if (!~followers[dst].indexOf(src))
        followers[dst].push(src)
      following[src] = following[src]||[]
      if (!~following[src].indexOf(dst))
        following[src].push(dst)
    } catch(e) { console.warn('failed to index follow', msg, e) }
  }

  function indexUnfollow(msg, link) {
    try {
      var src = msg.value.author
      var dst = link.feed
      followers[dst] = filter(followers[dst]||[], src)
      following[src] = filter(following[src]||[], dst)
    } catch(e) { console.warn('failed to index unfollow', msg, e) }
  }

  function filter(arr, item) {
    return arr.filter(function(v) { return v != item })
  }

  return {
    // new messages sink-stream
    in: function(done) { return pull.drain(process, done) },

    // output streams
    followers: function(id) { return pull.values(followers[id]||[]) },
    following: function(id) { return pull.values(following[id]||[]) },
    pubPeers: function() { return pull.values(pubPeers) },

    // getters
    isFollowing: function(a, b, cb) {
      var users = following[a] || []
      cb(null, (users.indexOf(b) !== -1))
    },

    // publishers
    follow: function(id, cb) {
      if (!id || typeof id != 'string') return cb(new Error('`id` string is required'))
      ssb.add({ type: 'follow', rel: 'follows', feed: id }, cb)
    },
    unfollow: function(id, cb) {
      if (!id || typeof id != 'string') return cb(new Error('`id` string is required'))
      ssb.add({ type: 'follow', rel: 'unfollows', feed: id }, cb)
    },
    announcePub: function(addr, cb) {
      if (typeof addr == 'string') {
        addr = addr.split(':')
        addr = { host: addr[0], port: addr[1]||2000 }
      }
      if (!addr || typeof addr != 'object' || !addr.host || typeof addr.host != 'string')
        return cb(new Error('`addr` object of {host:string, port:number} is required'))
      addr.port = +addr.port
      ssb.add({ type: 'pub', address: { host: addr.host, port: addr.port||2000 }}, cb)
    }
  }
}