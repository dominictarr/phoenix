var http     = require('http')
var fs       = require('fs')
var path     = require('path')
var pull     = require('pull-stream')
var toPull   = require('stream-to-pull-stream')
var concat   = require('concat-stream')
var prpc     = require('phoenix-rpc')
var connect  = require('../backend')
var util     = require('../common/util')

var allowedMethods = ['createReplicationStream']

function createServer(port) {
	connect(function(err, backend) {
		if (err) return console.error(err)

		// Read config
    backend.local = { relayPort: port }
		loadMembersFile(backend)
    
    // Setup periodic syncs
    require('../common/background-sync')(backend, 1000 * 60 * 15)

		// Start server
		var server = http.createServer(function (req, res) {
			function pathStarts(v) { return req.url.indexOf(v) === 0 }
			function pathEnds(v) { return req.url.indexOf(v) === (req.url.length - v.length); }
			function read(file) { return fs.createReadStream(path.join(__dirname, '../../' + file)); }
			function serve404(err) { res.writeHead(404); res.end('Not found') }

			// Routes
			if (pathStarts('/profile/')) {
				if (pathEnds('/pubkey'))
					return getPubkey(req, res, backend)
        if (pathEnds('/intro-token'))
          return getIntroToken(req, res, backend)
				return getProfile(req, res, backend)
			}
			if (pathStarts('/js/')) {
				res.writeHead(200, {'Content-Type': 'application/javascript'});
				return read(req.url).on('error', serve404).pipe(res);
			}
			if (pathStarts('/css/')) {
				res.writeHead(200, {'Content-Type': 'text/css'});
				return read(req.url).on('error', serve404).pipe(res);
			}
			if (pathStarts('/img/')) {
				if (pathEnds('jpg') || pathEnds('jpeg'))
					res.writeHead(200, {'Content-Type': 'image/jpeg'});
				else if (pathEnds('gif'))
					res.writeHead(200, {'Content-Type': 'image/gif'});
				else if (pathEnds('ico'))
					res.writeHead(200, {'Content-Type': 'image/x-icon'});
				else
					res.writeHead(200, {'Content-Type': 'image/png'});
				return read(req.url).on('error', serve404).pipe(res);
			}
			if (pathStarts('/fonts/')) {
				if (req.url.slice(-4) == 'woff') {
					res.writeHead(200, {'Content-Type': 'application/x-font-woff'});
					return read(req.url).on('error', serve404).pipe(res);
				} else if (req.url.slice(-5) == 'woff2') {
					res.writeHead(200, {'Content-Type': 'application/font-woff2'});
					return read(req.url).on('error', serve404).pipe(res);
				}
			}
			return getHomepage(req, res, backend)
		})

		server.on('connect', function(req, conn, head) {
			// RPC-stream connection
			console.log('Received CONNECT')
			conn.write('HTTP/1.1 200 Connection Established\r\n\r\n')
			conn.pipe(prpc.proxy(backend, allowedMethods)).pipe(conn)
		})
		server.listen(port)

		function onExit() { backend.close(); process.exit() }
		process.on('SIGINT', onExit).on('SIGTERM', onExit)
	})
}

function getHomepage(req, res, backend) {
  util.read('html/relay-home.html').on('error', util.serve404(res)).pipe(concat(function(html) {

    // Pull profiles
    var ctx = { host: require('os').hostname() }
    var fetchProfile = util.profileFetcher(backend)
    pull(
      toPull(backend.following()),
      pull.asyncMap(fetchProfile),
      pull.collect(function (err, entries) {
        if (err) { return console.error(err), res.writeHead(500), res.end() }
        ctx.users = entries.map(function(entry) {
          return '<h2><a href="/profile/'+entry.key.toString('hex')+'">'+entry.nickname+'</a></h2>'
        }).join('')
        
        res.writeHead(200, {'Content-Type': 'text/html'})
        res.end(util.renderCtx(html.toString(), ctx))
      })
    )
  }))
}

function getProfile(req, res, backend) {
  util.read('html/relay-profile.html').on('error', util.serve404(res)).pipe(concat(function(html) {
    var n = 0
    var fetchProfile = util.profileFetcher(backend)

    var id
    var ctx = { host: require('os').hostname() }
    ctx.id = req.url.slice('/profile/'.length)
    try { id = new Buffer(ctx.id, 'hex') }
    catch (e) { return res.writeHead(404), res.end() }
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

function getPubkey(req, res, backend) {
  var id = new Buffer(req.url.slice('/profile/'.length, -('/pubkey'.length)), 'hex')
  backend.getPublicKey(id, function(err, pubkey) {
    if (err && err.notFound) return res.writeHead(404), res.end();
    else if (err) return console.error(err), res.writeHead(500), res.end();
     
    res.writeHead(200, {'Content-Type': 'text/plain'})
    res.end(pubkey.toString('hex'))
  })
}

function getIntroToken(req, res, backend) {
  var id = req.url.slice('/profile/'.length, -('/intro-token'.length))
  if (!id) return res.writeHead(404), res.end()

  res.writeHead(200, {'Content-Type': 'application/json'})
  res.end(JSON.stringify({id: id, relays: [[require('os').hostname(), backend.local.relayPort]]}))  
}


function loadMembersFile(backend) {
	fs.readFile(path.join(__dirname, '../../.relay-members'), 'utf8', function(err, data) {
		if (err || !data) return
		data.replace(/\r/g, '').split('\n').forEach(function (key) {
			if (!key) return
			// :TODO: validate the key
			backend.follow(new Buffer(key, 'hex'))
		})
	})
}

module.exports = {
	createServer: createServer
}