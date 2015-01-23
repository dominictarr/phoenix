var fs   = require('fs')
var path = require('path')
var pull = require('pull-stream')
var toPull = require('stream-to-pull-stream')
var mlib = require('ssb-msgs')

function toBuffer() {
  return pull.map(function (s) { return Buffer.isBuffer(s) ? s : new Buffer(s, 'base64') })
}

module.exports = function(server) {
  var msgExtRe = /^\/msg\/([^\.]+\.blake2s)\/ext\/(.+)/i
  return function(req, res, next) {
    function pathStarts(v) { return req.url.indexOf(v) === 0; }

    var msgExtMatch = msgExtRe.exec(req.url)
    if (pathStarts('/ext/') || msgExtMatch) {
      // restrict the CSP
      res.setHeader('Content-Security-Policy', 'default-src \'self\' \'unsafe-inline\' \'unsafe-eval\' data:; connect-src \'none\'; object-src \'none\'; frame-src \'none\'; sandbox allow-same-origin allow-scripts allow-popups')
    }

    if (pathStarts('/ext/')) {
      var hash = req.url.slice(5)
      return server.blobs.has(hash, function(err, has) {
        if (!has) {
          res.writeHead(404)
          res.end('File not found')
          return
        }
        pull(
          server.blobs.get(hash),
          toBuffer(),
          toPull(res)
        )
      })
    }

    if (msgExtMatch) {
      var msgid = msgExtMatch[1]
      var name  = decodeURI(msgExtMatch[2])
      return server.ssb.get(msgid, function (err, msg) {
        if (err || !msg) {
          res.writeHead(404)
          res.end('File not found')
          return
        }

        // try to find an ext link with the given name
        var links = mlib.getLinks(msg.content, { toext: true })
        console.log(links)
        for (var i=0; i < links.length; i++) {
          console.log(links[i].name === name, links[i].name, name)
          if (links[i].name === name) {
            return pull(
              server.blobs.get(links[i].ext),
              toBuffer(),
              toPull(res)
            )
          }
        }

        res.writeHead(404)
        res.end('File not found')
      })
    }

    next()
  }
}