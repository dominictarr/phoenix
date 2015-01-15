var stack = require('stack')
var api   = require('phoenix-api')

exports.name        = 'phoenix'
exports.version     = '1.0.0'
exports.manifest    = api.manifest
exports.permissions = api.permissions

exports.init = function (server) {
  server.on('request', stack(
    function (req, res, next) {
      // Local-host only
      if (req.socket.remoteAddress != '127.0.0.1') {
        console.log('Remote access attempted by', req.socket.remoteAddress)
        res.writeHead(403)
        return res.end('Remote access forbidden')
      }
      // CSPs
      res.setHeader('Content-Security-Policy', 'default-src \'self\'; connect-src \'self\' ws://localhost:'+server.config.port)
      next()
    },
    require('./domain-auth')(server),
    require('./static-assets-builder')(server),
    require('./static-assets')(server)
  ))

  return api.init(server)
}