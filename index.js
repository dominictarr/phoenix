var stack = require('stack')

exports.name = 'phoenix'
exports.version = '1.0.0'

exports.manifest = {
}
exports.permissions = {
  anonymous: {}
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
    require('./static-assets-builder')(server),
    require('./static-assets')(server)
  ))
}