var fs = require('fs')
var path = require('path')
var pull = require('pull-stream')
var toPull = require('stream-to-pull-stream')
var concat = require('concat-stream')
var util = require('../common/util')

function renderPage(req, res, backend, ctx) {
  ctx.cuser_id = backend.local.user.name.toString('hex')
  util.read('html/profile.html').on('error', util.serve404(res)).pipe(concat(function(html) {
    var n = 0
    var fetchProfile = util.profileFetcher(backend)

    ctx.id = req.url.slice('/profile/'.length)
    var id = new Buffer(ctx.id, 'hex')
    fetchProfile({ key: id }, function(err, profile) {
      if (err && err.notFound) return res.writeHead(404), res.end();
      else if (err) return console.error(err), res.writeHead(500), res.end();

      ctx.nickname = profile.nickname
      pull(
        toPull(backend.createHistoryStream(id, 0)),
        pull.collect(function (err, entries) {
          if (err) { return console.error(err), res.writeHead(500), res.end() }
          ctx.feed_entries = entries
            .map(function(msg) {
              if (!ctx.joindate) ctx.joindate = util.prettydate(new Date(msg.timestamp), true)
              msg.nickname = profile.nickname;
              return util.renderMsg(msg)
            })
            .reverse()
            .join('')
          
          res.writeHead(200, {'Content-Type': 'text/html'})
          res.end(util.renderCtx(html.toString(), ctx))
        })
      )
    })
  }))
}

exports.get = function(req, res, backend) {
  renderPage(req, res, backend, { error: '' })
}

exports.getPubkey = function(req, res, backend) {
  var id = new Buffer(req.url.slice('/profile/'.length, -('/pubkey'.length)), 'hex')
  backend.getPublicKey(id, function(err, pubkey) {
    if (err && err.notFound) return res.writeHead(404), res.end();
    else if (err) return console.error(err), res.writeHead(500), res.end();
     
    res.writeHead(200, {'Content-Type': 'text/plain'})
    res.end(pubkey.toString('hex'))
  })
}