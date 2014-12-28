var stack = require('stack')

exports.name = 'phoenix'
exports.version = '1.0.0'

exports.manifest = {
  useInvite: 'async'
}
exports.permissions = {
  anonymous: {deny: ['useInvite']}
}

exports.init = function (server) {
  server.on('request', stack(
    function (req, res, next) {
      // Local-host only
      if (req.socket.remoteAddress != '127.0.0.1') {
        console.log('Remote access attempted by', req.socket.remoteAddress)
        res.writeHead(403)
        return res.end('Remote access forbidden')
      }
      next()
    },
    require('./domain-auth')(server),
    require('./static-assets')(server)
  ))

  return {
    // connect to the peer and use the invite code
    useInvite: function(invite, cb) {
      if (!invite.address || !invite.secret)
        return cb(new Error('Invalid invite'))

      var addr = invite.address.split(':')
      if (addr.length === 2)
        addr = { host: addr[0], port: addr[1] }
      else
        addr = { host: addr[0], port: 2000 }

      // connect to and auth with the given server
      var rpc = server.connect(addr)

      // use the invite
      var hmacd = server.options.signObjHmac(invite.secret, {
        keyId: server.options.hash(invite.secret, 'base64'),
        feed: server.feed.id,
        ts: Date.now()
      })
      rpc.invite.use(hmacd, function (err, msg) {
        if (err) return cb(err)

        // publish pub message
        server.feed.add('pub', {address: addr}, function(err) {
          if (err) return cb(err)
          cb()
        })
      })
    }
  }
}