var http    = require('http');
var fs      = require('fs');
var path    = require('path');
var concat  = require('concat-stream')
var connect = require('../backend')

var feed = require('./feed')
var profile = require('./profile')
var network = require('./network')

function createServer(port) {
	connect(function (err, backend) {
		if (err) return console.error(err);

		// Pull state from the backend
		backend.local = { userid: null }
		backend.getKeys(function(err, keys) {
			if (err) throw err
			backend.local.userid = keys.name
			backend.local.userpubkey = keys.public
		})
		backend.getSyncState(function(err, state) {
			if (state && state.lastSync)
				require('./tmp').lastSync = new Date(state.lastSync)
		})

		// Setup periodic syncs
		require('../common/background-sync')(backend, 1000 * 60 * 15)

		// Create HTTP server
		var server = http.createServer(function (req, res) {
			function pathStarts(v) { return req.url.indexOf(v) === 0; }
			function pathEnds(v) { return req.url.indexOf(v) === (req.url.length - v.length); }
			function read(file) { return fs.createReadStream(path.join(__dirname, '../../' + file)); }
			function serve404() {  res.writeHead(404); res.end('Not found'); }
			
			// Homepage
			if (req.url == '/' || req.url == '/index.html') {
				if (req.method == 'POST')
					return feed.post(req, res, backend)
				return feed.get(req, res, backend)
			}
			
			// Profiles
			if (pathStarts('/profile/')) {
				if (pathEnds('/pubkey'))
					return profile.getPubkey(req, res, backend)
				return profile.get(req, res, backend)
			}
			if (req.url == '/intro-token')
				return profile.getIntroToken(req, res, backend)
			if (req.url == '/feeds' && req.method == 'POST')
				return profile.addFeed(req, res, backend)

			// Network nodes
			if (pathStarts('/network')) {
				if (req.method == 'POST' && pathStarts('/network/del/'))
					return network.deleteNode(req, res, backend)
				if (req.method == 'POST' && req.url == '/network/sync')
					return network.sync(req, res, backend)
				// if (req.url.length > '/network/'.length)
					// return network.getNode(req, res, backend)
				if (req.method == 'POST')
					return network.post(req, res, backend)
				return network.get(req, res, backend)
			}

			// Assets
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
			serve404();
		});
		server.listen(port, '127.0.0.1');
	})
}

module.exports = {
	createServer: createServer
};