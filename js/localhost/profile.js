var fs = require('fs')
var path = require('path')
var pull = require('pull-stream')
var toPull = require('stream-to-pull-stream')
var concat = require('concat-stream')
var util = require('./util')

function renderPage(req, res, backend, ctx) {
  util.read('html/profile.html').on('error', util.serve404(res)).pipe(concat(function(html) {
    var n = 0
    var fetchProfile = util.profileFetcher(backend)

    var id = new Buffer(req.url.slice('/profile/'.length), 'hex')
    fetchProfile({ key: id }, function(err, profile) {
      if (err && err.notFound) return res.writeHead(404), res.end();
      else if (err) return console.error(err), res.writeHead(500), res.end();

      ctx.nickname = profile.nickname
      pull(
        toPull(backend.createHistoryStream(id, 0)),
        pull.collect(function (err, entries) {
          if (err) { return console.error(err), res.writeHead(500).end() }
          ctx.feed_entries = entries
            .map(function(msg) { msg.nickname = profile.nickname; return util.renderMsg(msg) })
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