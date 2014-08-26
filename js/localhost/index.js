var http = require('http');
var fs   = require('fs');
var path = require('path');

function createServer(port) {
	var server = http.createServer(function (req, res) {
		function pathStarts(v) { return req.url.indexOf(v) === 0; }
		function read(file) { return fs.createReadStream(path.join(__dirname, '../../' + file)); }
		function serve404() {  res.writeHead(404); res.end('Not found'); }
		if (req.url == '/' || req.url == '/index.html') {
			res.writeHead(200, {'Content-Type': 'text/html'});
			return read('feeds.html').on('error', serve404).pipe(res);
		}
		if (pathStarts('/profile/')) {
			res.writeHead(200, {'Content-Type': 'text/html'});
			return read('profile.html').on('error', serve404).pipe(res);
		}
		if (pathStarts('/search/')) {
			res.writeHead(200, {'Content-Type': 'text/html'});
			return read('search.html').on('error', serve404).pipe(res);
		}
		if (pathStarts('/decrypt')) {
			res.writeHead(200, {'Content-Type': 'text/html'});
			return read('decrypt.html').on('error', serve404).pipe(res);
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
	return server;
}

module.exports = {
	createServer: createServer
};