var fs = require('fs')
var path = require('path')
var pull = require('pull-stream')
var toPull = require('stream-to-pull-stream')
var concat = require('concat-stream')
var util = require('../common/util')

function renderPage(req, res, backend, ctx) {
  ctx.cuser_id = backend.local.userid.toString('hex')
  ctx.last_sync = (backend.local.lastSync) ? util.prettydate(backend.local.lastSync, true) : '--'

  util.read('html/feeds.html').on('error', util.serve404(res)).pipe(concat(function(html) {
    var n = 0
    var fetchProfile = util.profileFetcher(backend)

    pull(
      toPull(backend.createFeedStream({reverse: true})),
      pull.asyncMap(fetchProfile),
      pull.collect(function (err, entries) {
        if (err) { return console.error(err), res.writeHead(500), res.end() }
        ctx.feed_entries = entries.map(util.renderMsg).join('')
        if (++n == 2) finish()
      })
    )

    pull(
      toPull(backend.following()),
      pull.asyncMap(fetchProfile),
      pull.collect(function (err, entries) {
        if (err) { return console.error(err), res.writeHead(500), res.end() }
        ctx.friends = entries.map(function(entry) { return '<a href="/profile/'+entry.key.toString('hex')+'">'+entry.nickname+'</a><br>'; }).join('')
        if (++n == 2) finish()
      })
    )

    function finish() {
      res.writeHead(200, {'Content-Type': 'text/html'})
      res.end(util.renderCtx(html.toString(), ctx))
    }
  }))
}

exports.get = function(req, res, backend) {
  renderPage(req, res, backend, { error: '' })
}

exports.post = function(req, res, backend) {
  req.pipe(concat(function(form) {

    var form = require('querystring').parse(form.toString())
    if (form && form.plain) {
      backend.text_post(form.plain, serve)
    } else {
      serve(new Error('Cant post an empty message'))
    }

    function serve(err) {
      renderPage(req, res, backend, { error: (err) ? err.toString() : '' })
    }
  }))
}