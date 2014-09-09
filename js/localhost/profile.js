var fs     = require('fs')
var path   = require('path')
var pull   = require('pull-stream')
var toPull = require('stream-to-pull-stream')
var concat = require('concat-stream')
var util   = require('../common/util')

function renderPage(req, res, backend, ctx) {
  ctx.cuser_id = backend.local.userid.toString('hex')
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
    if (err && err.notFound) return res.writeHead(404), res.end()
    else if (err) return console.error(err), res.writeHead(500), res.end()
     
    res.writeHead(200, {'Content-Type': 'text/plain'})
    res.end(pubkey.toString('hex'))
  })
}

exports.addFeed = function(req, res, backend) {
  req.pipe(concat(function(form) {

    var form = require('querystring').parse(form.toString())
    if (form && form.token) {
      // Try as an intro token
      try {
        var token = JSON.parse(form.token)
        if (!token.id) return res.writeHead(422), res.end('Bad token -- the id field is required')

        // Follow
        var id = new Buffer(token.id, 'hex')
        if (id.length != 32) return res.writeHead(422), res.end('Bad token -- the id must be 32 hex-encoded bytes')
        backend.follow(id, function(err) {
          if (err) return res.writeHead(500), res.end('Internal error while trying to add this feed')

          if (!token.relays || token.relays.length === 0) {
            // Done
            res.writeHead(303, {'Location': '/'})
            res.end()
          }

          backend.addNodes(token.relays, function(err) {
            if (err) return res.writeHead(500), res.end('Successfully followed the user, but failed to add their relays to your network. You may have trouble getting the user\'s feed')
            res.writeHead(303, {'Location': '/'})
            res.end()
          })
        })
        return

      } catch (e) {}
    }
    return res.writeHead(422), res.end('Bad input -- must be a valid intro token')
  }))
}

exports.getIntroToken = function(req, res, backend) {
  // :TODO: it's not actually accurate that the user might be at all of these ndoes
  //        Get an accurate list!
  backend.getNodes(function(err, nodes) {
    if (err) return console.error(err), res.writeHead(500), res.end();

    res.writeHead(200, {'Content-Type': 'application/json'})
    res.end(JSON.stringify({id: backend.local.userid.toString('hex'), relays: nodes}))  
  })
}