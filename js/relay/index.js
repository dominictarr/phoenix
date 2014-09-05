var http     = require('http');
var fs       = require('fs');
var path     = require('path');
var hduplex  = require('http-duplex');
var toStream = require('pull-stream-to-stream');
var pull     = require('pull-stream');
var prpc     = require('phoenix-rpc');
var connect  = require('../backend');

var allowedMethods = ['createReplicationStream']

function createServer(port) {
	connect(function(err, backend) {
		if (err) return console.error(err);

		// Sync config
		loadMembersFile(backend);

		// Start server
		var server = http.createServer(function (req, res) {
			function serve404(err) { res.writeHead(404); res.end('Not found'); }
			fs.createReadStream(path.join(__dirname, '../../README.md')).on('error', serve404).pipe(res);
		});
		server.on('connect', function(req, conn, head) {
			console.log('Received CONNECT');
			conn.write('HTTP/1.1 200 Connection Established\r\n\r\n');
			conn.pipe(prpc.proxy(backend, allowedMethods)).pipe(conn);
		});
		server.listen(port);

		function onExit() { backend.close(); process.exit(); }
		process.on('SIGINT', onExit).on('SIGTERM', onExit);
	});
}

function loadMembersFile(backend) {
	fs.readFile(path.join(__dirname, '../../.relay-members'), 'utf8', function(err, data) {
		if (err || !data) return;
		data = data.replace(/\r/g, '').split('\n');
		data.forEach(function (key) {
			if (!key) return;
			try {
				key = new Buffer(key, 'hex');
			} catch (e) {
				console.error('Bad value found in .relay-members file.');
				console.error(e);
				return;
			}
			backend.follow(key);
		});
	});
}

module.exports = {
	createServer: createServer
};